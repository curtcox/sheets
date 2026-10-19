"""Independent Quarto CLI/Jupyter/knitr contract checks; no app imports.

Install the pinned Python requirements and Quarto 1.10.19. Full CI also uses
Ubuntu 24.04's knitr 1.45/rmarkdown. --language python allows local checks without R.
No browser-produced expected output is accepted by this script.
"""
import argparse
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent.parent
fixtures = root / "tests/fixtures/quarto"
parser = argparse.ArgumentParser()
parser.add_argument("--language", choices=["python", "r"])
parser.add_argument("--check", action="store_true")
args = parser.parse_args()
quarto = os.environ.get("SHEETS_QUARTO_BIN", "quarto")
assert subprocess.check_output([quarto, "--version"], text=True).strip() == "1.10.19"
expected = json.loads((fixtures / "controls-reference.json").read_text())


class Visible(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.text = []
        self.alts = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        if tag == "img":
            self.alts.append(dict(attrs).get("alt"))

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip -= 1

    def handle_data(self, text):
        if not self.skip:
            self.text.append(text)


for language in [args.language] if args.language else ["python", "r"]:
    if language == "r":
        subprocess.run(["Rscript", "--vanilla", "-e", 'stopifnot(as.character(packageVersion("knitr")) == "1.45")'], check=True)
    else:
        import matplotlib
        assert matplotlib.__version__ == "3.9.4"
    with tempfile.TemporaryDirectory(prefix="sheets-quarto-reference-") as temporary:
        directory = Path(temporary)
        for kind in ["controls", "defaults", "halt"] + (["halt-hidden"] if language == "r" else []):
            name = f"{kind}-{language}.qmd"
            shutil.copyfile(fixtures / name, directory / name)
            result = subprocess.run([quarto, "render", name, "--to", "html", "--no-execute-daemon"], cwd=directory, env=dict(os.environ, QUARTO_PYTHON=sys.executable), text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            if kind.startswith("halt"):
                assert result.returncode != 0, f"{language}: error:false must halt"
                assert expected[language]["hiddenHalt" if kind == "halt-hidden" else "halt"] in result.stdout, result.stdout
                assert not (directory / "after-halt.txt").exists(), f"{language}: later cell executed"
            else:
                assert result.returncode == 0, result.stdout
                document = Visible()
                document.feed((directory / name.replace(".qmd", ".html")).read_text())
                text = " ".join(" ".join(document.text).split())
                contract = expected[language] if kind == "controls" else expected[language]["defaults"]
                for marker in contract["visible"]:
                    assert marker in text, f"{language}: missing {marker}\n{text}"
                for marker in contract["hidden"]:
                    assert marker not in text, f"{language}: leaked {marker}"
                if kind == "controls":
                    assert expected[language]["alt"] in document.alts, f"{language}: missing plot alt text"
        print(f"Quarto 1.10.19 {language}: include, output, warning, continuation/halt, figure size and alt contract verified.")

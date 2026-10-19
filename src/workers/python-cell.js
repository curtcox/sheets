// Kept outside the worker wrapper so the capture contract stays readable.
export const pythonCell = String.raw`
import ast, io, json, contextlib, os, sys, importlib.util, tokenize
os.environ["MPLBACKEND"] = "Agg"
_sheets_globals = {"__name__": "__main__"}
_sheets_sized = False
_sheets_environment_set = False

def _sheets_cell(source, options_json):
    global _sheets_sized, _sheets_environment_set
    stdout, stderr = io.StringIO(), io.StringIO()
    result = {"stdout": "", "stderr": "", "html": "", "text": "", "figures": []}
    options = json.loads(options_json)
    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
        try:
            size = options.get("figureSize")
            if size:
                if not _sheets_environment_set:
                    os.environ["QUARTO_FIG_WIDTH"] = str(size["width"])
                    os.environ["QUARTO_FIG_HEIGHT"] = str(size["height"])
                    _sheets_environment_set = True
                if not _sheets_sized and importlib.util.find_spec("matplotlib"):
                    import matplotlib
                    matplotlib.rcParams["figure.figsize"] = [size["width"], size["height"]]
                    _sheets_sized = True
            tree = ast.parse(source)
            meaningful = [token for token in tokenize.generate_tokens(io.StringIO(source).readline)
                          if token.type not in (tokenize.NL, tokenize.NEWLINE, tokenize.INDENT,
                                                tokenize.DEDENT, tokenize.COMMENT, tokenize.ENDMARKER)]
            quiet = bool(meaningful and meaningful[-1].type == tokenize.OP and meaningful[-1].string == ";")
            last = tree.body.pop() if tree.body and isinstance(tree.body[-1], ast.Expr) else None
            exec(compile(tree, "<cell>", "exec"), _sheets_globals)
            if last is not None:
                value = eval(compile(ast.Expression(last.value), "<cell>", "eval"), _sheets_globals)
                if value is not None and not quiet:
                    if hasattr(value, "_repr_html_"):
                        result["html"] = value._repr_html_() or ""
                    else:
                        result["text"] = repr(value)
        except Exception as error:
            result["error"] = type(error).__name__ + ": " + str(error)
        finally:
            if "matplotlib.pyplot" in sys.modules:
                import matplotlib.pyplot as plt
                try:
                    for number in plt.get_fignums():
                        buffer = io.StringIO()
                        plt.figure(number).savefig(buffer, format="svg")
                        result["figures"].append(buffer.getvalue())
                except Exception as error:
                    result.setdefault("error", type(error).__name__ + ": " + str(error))
                finally:
                    plt.close("all")
    result["stdout"] = stdout.getvalue()
    result["stderr"] = stderr.getvalue()
    return json.dumps(result)
`;

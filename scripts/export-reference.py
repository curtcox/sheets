"""Independent OOXML inspection and change-input/recalculate reference check.
Requires openpyxl==3.1.5 and LibreOffice Calc. Never updates expected results.
"""
import pathlib
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile
import openpyxl

root = pathlib.Path(sys.argv[1])
source = root / 'export-model.xlsx'
with zipfile.ZipFile(source) as archive:
    assert archive.testzip() is None
    xml = ET.fromstring(archive.read('xl/workbook.xml'))
    namespace = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    settings = xml.find('s:calcPr', namespace)
    assert settings is not None and settings.get('fullCalcOnLoad') == '1'
workbook = openpyxl.load_workbook(source)
assert workbook['Table 1']['D2'].value.startswith('=')
assert 'Inputs' in workbook['Table 1']['D2'].value
assert workbook['Inputs']['B2'].value == 2
assert openpyxl.load_workbook(source, data_only=True)['Table 1']['D2'].value == 24
workbook['Table 1']['B2'] = 10
changed = root / 'changed.xlsx'
workbook.save(changed)
calc = shutil.which('libreoffice') or shutil.which('soffice')
if not calc:
    raise SystemExit('Package inspection passed; LibreOffice is required for recalculation.')
with tempfile.TemporaryDirectory(prefix='sheets-calc-') as directory:
    profile = pathlib.Path(directory) / 'profile'
    output = pathlib.Path(directory) / 'output'
    output.mkdir()
    subprocess.run([calc, '-env:UserInstallation=' + profile.as_uri(), '--headless',
                    '--convert-to', 'xlsx', '--outdir', str(output), str(changed.resolve())],
                   check=True, timeout=60)
    computed = openpyxl.load_workbook(output / 'changed.xlsx', data_only=True)
    assert computed['Table 1']['D2'].value == 80, computed['Table 1']['D2'].value
    assert computed['Table 1']['D3'].value == 60
print('Independent OOXML and LibreOffice input-change recalculation: 24 → 80 verified.')

from pathlib import Path
import base64, re
root = Path('/home/user/milyfe-platform/public')
css = (root/'style.css').read_text()
common = (root/'common.js').read_text()
logo_uri = 'data:image/png;base64,' + base64.b64encode((root/'logo.png').read_bytes()).decode('ascii')
for name in ['index.html','login.html','onboarding.html','citizen.html','admin.html']:
    p = root/name
    html = p.read_text()
    # remove/replace stylesheet link with inline CSS
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="/?style\.css"\s*/?>', '<style>\n' + css + '\n</style>', html)
    # replace common script with inline common JS
    html = re.sub(r'<script\s+src="/?common\.js"\s*>\s*</script>', '<script>\n' + common + '\n</script>', html)
    # embed logos so the Arena preview does not show broken images
    html = html.replace('src="/logo.png"', f'src="{logo_uri}"')
    html = html.replace('src="logo.png"', f'src="{logo_uri}"')
    # normalize accidental escaped quote artifacts if any
    html = html.replace('\\"', '"')
    p.write_text(html)
print('inlined CSS/common/logo into HTML files')

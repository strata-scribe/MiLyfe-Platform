from pathlib import Path
import base64, re

repo_root = Path(__file__).resolve().parent.parent
public_root = repo_root / 'milyfe-platform' / 'public'
landing_root = repo_root / 'milyfe-landing'

logo_path = repo_root / 'uploads' / 'logo.png'
if not logo_path.exists():
    logo_path = public_root / 'logo.png'

logo_bytes = logo_path.read_bytes()
logo_uri = 'data:image/png;base64,' + base64.b64encode(logo_bytes).decode('ascii')

# 1. Update milyfe-platform/public HTML pages
css = (public_root / 'style.css').read_text()
common = (public_root / 'common.js').read_text()

for name in ['index.html', 'login.html', 'onboarding.html', 'citizen.html', 'admin.html']:
    p = public_root / name
    if not p.exists():
        continue
    html = p.read_text()
    # remove/replace stylesheet link with inline CSS
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="/?style\.css"\s*/?>', '<style>\n' + css + '\n</style>', html)
    # replace common script with inline common JS
    html = re.sub(r'<script\s+src="/?common\.js"\s*>\s*</script>', '<script>\n' + common + '\n</script>', html)
    # replace any existing logo src (relative or data URI)
    html = re.sub(r'src="data:image/png;base64,[^"]*"', f'src="{logo_uri}"', html)
    html = html.replace('src="/logo.png"', f'src="{logo_uri}"')
    html = html.replace('src="logo.png"', f'src="{logo_uri}"')
    # ensure favicon is present
    if '<link rel="icon"' not in html:
        html = re.sub(r'<title>', f'<link rel="icon" type="image/png" href="{logo_uri}"><title>', html, count=1)
    else:
        html = re.sub(r'<link\s+rel="icon"[^>]*>', f'<link rel="icon" type="image/png" href="{logo_uri}">', html)
    # normalize accidental escaped quote artifacts if any
    html = html.replace('\\"', '"')
    p.write_text(html)
    print(f'Updated {name}')

# 2. Update milyfe-landing/index.html
landing_html_path = landing_root / 'index.html'
if landing_html_path.exists():
    html = landing_html_path.read_text()
    html = re.sub(r'src="data:image/png;base64,[^"]*"', f'src="{logo_uri}"', html)
    html = html.replace('src="/logo.png"', f'src="{logo_uri}"')
    html = html.replace('src="logo.png"', f'src="{logo_uri}"')
    if '<link rel="icon"' not in html:
        html = re.sub(r'<title>', f'<link rel="icon" type="image/png" href="{logo_uri}"><title>', html, count=1)
    else:
        html = re.sub(r'<link\s+rel="icon"[^>]*>', f'<link rel="icon" type="image/png" href="{logo_uri}">', html)
    landing_html_path.write_text(html)
    print('Updated milyfe-landing/index.html')

print('All HTML pages in platform and landing have been updated with the canonical logo URI and favicon.')

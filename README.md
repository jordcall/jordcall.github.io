# jordan-call.com

Personal website for Jordan Call — essays, music, projects, and miscellany.

**Live:** https://jordan-call.com  
**Repo:** https://github.com/jordcall.github.io

## How updates work
This site is hosted on **GitHub Pages**.

Typical workflow:
1. Edit files in VS Code
2. Commit + push to `main`
3. GitHub Pages redeploys automatically (usually within a minute or two)

If you’re making a bigger change, use a branch + pull request.

## Common commands

### Update the Now page
1) Archive current Now + reset template:
   node scripts/archive-now.js
2) Edit now.html (CURRENT section)
3) Preview locally:
   python -m http.server 8000
   then open http://localhost:8000/now.html


All content © Jordan Call unless otherwise noted.

## Local preview
From the repo root:

```bash
python3 -m http.server 8000



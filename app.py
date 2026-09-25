import streamlit as st
import streamlit.components.v1 as components
import os

st.set_page_config(page_title="ULPF Workflow", layout="wide")

# Reduce Streamlit's default container margins to use full screen width
st.markdown("""
<style>
    .block-container {
        padding-top: 1rem;
        padding-bottom: 0rem;
        padding-left: 1rem;
        padding-right: 1rem;
        max-width: 100%;
    }
</style>
""", unsafe_allow_html=True)

st.title("ULPF Log Processing Pipeline")
st.markdown("Use the interactive interface below to simulate how logs are processed through the AI-assisted pipeline.")

# Get absolute paths to the files
base_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(base_dir, "workflow-full.html")
css_path = os.path.join(base_dir, "workflow-full.css")
js_path = os.path.join(base_dir, "workflow-full.js")

# Read the files
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

with open(js_path, "r", encoding="utf-8") as f:
    js_content = f.read()

# Fix body centering and reduce padding so it takes full width
css_content = css_content.replace(
    'justify-content: center;',
    'justify-content: flex-start;'
)
css_content = css_content.replace(
    'padding: 40px;',
    'padding: 10px;'
)



# Replace the external CSS link with inline <style>
html_content = html_content.replace(
    '<link rel="stylesheet" href="workflow-full.css">',
    f'<style>{css_content}</style>'
)

# Replace the external JS link with inline <script>
html_content = html_content.replace(
    '<script src="workflow-full.js"></script>',
    f'<script>{js_content}</script>'
)

# Inject CSS to make the fixed-width diagram scale down responsively
responsive_css = """
<style>
.paper {
  transform: scale(min(1, calc(100vw / 1300)));
  transform-origin: top left;
}
</style>
"""
html_content = html_content.replace('</head>', f'{responsive_css}</head>')

# Render the HTML component in Streamlit (remove forced width so it fits container)
components.html(html_content, height=1700, scrolling=True)

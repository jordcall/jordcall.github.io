#!/usr/bin/env python3
"""
CODEBASE SNAPSHOT SCRIPT - Beginner Instructions

HOW TO RUN THIS SCRIPT:

1. OPEN YOUR TERMINAL:
   - On Mac: Press Cmd + Space, type "Terminal", press Enter
   - On Windows: Press Win + R, type "cmd", press Enter
   - On Linux: Press Ctrl + Alt + T

2. NAVIGATE TO YOUR PROJECT FOLDER:
   - Type: cd /path/to/your/project
   - Or if you're already in the right folder, skip this step

3. RUN THE SCRIPT:
   - Type: python3 snapshot.py
   - Press Enter
   - The script will create a file called 'snapshot.md' in your project folder

4. FIND YOUR OUTPUT:
   - Look for 'snapshot.md' in your project folder
   - This file contains your entire codebase organized and readable

WHAT THIS SCRIPT DOES:
- Reads all files in your project
- Skips files listed in .gitignore (like node_modules, .env files, etc.)
- Creates a markdown file with your project structure and all code
- Organizes everything with clear sections and XML tags for easy reading

If you get an error about 'python3', try 'python snapshot.py' instead.
"""

import os
import fnmatch
from pathlib import Path

def read_gitignore():
    """
    Read the .gitignore file and return a list of patterns to ignore.
    This function looks for a .gitignore file in the current directory
    and reads all the patterns that should be excluded from the snapshot.
    """
    gitignore_patterns = []
    gitignore_path = Path('.gitignore')
    
    # Check if .gitignore exists in the current directory
    if gitignore_path.exists():
        try:
            with open(gitignore_path, 'r', encoding='utf-8') as f:
                for line in f:
                    # Remove whitespace and skip empty lines and comments
                    line = line.strip()
                    if line and not line.startswith('#'):
                        gitignore_patterns.append(line)
                        print(f"Found .gitignore pattern: {line}")
        except Exception as e:
            print(f"Warning: Could not read .gitignore: {e}")
    else:
        print("No .gitignore file found - will include all files")
    
    return gitignore_patterns

def should_ignore_path(path, gitignore_patterns, custom_excludes):
    """
    Check if a file or directory should be ignored based on:
    1. .gitignore patterns
    2. Custom exclude patterns defined below
    
    This function returns True if the path should be skipped.
    """
    path_str = str(path)
    
    # Check custom excludes first
    for exclude in custom_excludes:
        if fnmatch.fnmatch(path_str, exclude) or exclude in path_str:
            return True
    
    # Check .gitignore patterns
    for pattern in gitignore_patterns:
        # Handle different types of gitignore patterns
        if pattern.endswith('/'):
            # Directory pattern
            if fnmatch.fnmatch(path_str + '/', pattern) or pattern.rstrip('/') in path.parts:
                return True
        elif pattern.startswith('/'):
            # Root-relative pattern
            if fnmatch.fnmatch(path_str, pattern[1:]):
                return True
        else:
            # General pattern - check if it matches any part of the path
            if fnmatch.fnmatch(path.name, pattern) or fnmatch.fnmatch(path_str, pattern):
                return True
            # Also check if pattern matches any parent directory
            for part in path.parts:
                if fnmatch.fnmatch(part, pattern):
                    return True
    
    return False

def get_file_tree(root_path, gitignore_patterns, custom_excludes):
    """
    Generate a visual tree structure of all files and directories
    that will be included in the snapshot.
    """
    tree_lines = []
    root = Path(root_path)
    
    def add_to_tree(path, prefix="", is_last=True):
        """Recursively build the tree structure with nice formatting"""
        if should_ignore_path(path.relative_to(root), gitignore_patterns, custom_excludes):
            return
        
        # Choose the right tree symbol
        current_prefix = "└── " if is_last else "├── "
        tree_lines.append(f"{prefix}{current_prefix}{path.name}")
        
        # If it's a directory, add its contents
        if path.is_dir():
            try:
                # Get all items in the directory
                items = sorted([p for p in path.iterdir() 
                              if not should_ignore_path(p.relative_to(root), gitignore_patterns, custom_excludes)])
                
                for i, item in enumerate(items):
                    is_last_item = (i == len(items) - 1)
                    next_prefix = prefix + ("    " if is_last else "│   ")
                    add_to_tree(item, next_prefix, is_last_item)
                    
            except PermissionError:
                tree_lines.append(f"{prefix}    [Permission Denied]")
    
    # Start building the tree
    tree_lines.append(f"{root.name}/")
    try:
        items = sorted([p for p in root.iterdir() 
                       if not should_ignore_path(p.relative_to(root), gitignore_patterns, custom_excludes)])
        
        for i, item in enumerate(items):
            is_last_item = (i == len(items) - 1)
            add_to_tree(item, "", is_last_item)
            
    except PermissionError:
        tree_lines.append("[Permission Denied]")
    
    return tree_lines

def get_all_files(root_path, gitignore_patterns, custom_excludes):
    """
    Get a list of all files that should be included in the snapshot.
    This walks through all directories and collects file paths.
    """
    files = []
    root = Path(root_path)
    
    # Walk through all directories
    for path in root.rglob('*'):
        # Skip if it matches ignore patterns
        relative_path = path.relative_to(root)
        if should_ignore_path(relative_path, gitignore_patterns, custom_excludes):
            continue
        
        # Only include actual files, not directories
        if path.is_file():
            files.append(path)
    
    # Sort files for consistent output
    return sorted(files)

def read_file_content(file_path):
    """
    Safely read the content of a file.
    Handles different encodings and binary files gracefully.
    """
    try:
        # Try to read as text with UTF-8 encoding first
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            # Try with latin-1 encoding if UTF-8 fails
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception:
            return "[Binary file or encoding error - content not displayable]"
    except Exception as e:
        return f"[Error reading file: {e}]"

def create_snapshot():
    """
    Main function that creates the snapshot.md file with the entire codebase.
    """
    print("🚀 Starting codebase snapshot...")
    
    # CUSTOMIZE YOUR EXCLUDES HERE
    # Add any files or directories you want to exclude beyond .gitignore
    custom_excludes = [
        'snapshot.py',      # Don't include this script itself
        'snapshot.md',      # Don't include previous snapshots
        '*.pyc',           # Python compiled files
        '__pycache__',     # Python cache directories
        '.DS_Store',       # Mac system files
        'Thumbs.db',       # Windows system files
        '*.tmp',           # Temporary files
        '*.log',           # Log files
        # Add your own patterns here like:
        # 'secret_config.json',
        # 'private_folder/*',
        # '*.backup',
    ]
    
    print("📋 Custom exclusions:", custom_excludes)
    
    # Read .gitignore patterns
    gitignore_patterns = read_gitignore()
    
    # Get current directory as root
    root_path = Path('.')
    
    print("🌳 Building file tree...")
    # Generate file tree
    tree_lines = get_file_tree(root_path, gitignore_patterns, custom_excludes)
    
    print("📁 Collecting files...")
    # Get all files to include
    files = get_all_files(root_path, gitignore_patterns, custom_excludes)
    
    print(f"📝 Found {len(files)} files to include in snapshot")
    
    # Create the snapshot markdown file
    with open('snapshot.md', 'w', encoding='utf-8') as output:
        # Write header
        output.write("# Codebase Snapshot\n\n")
        output.write(f"Generated from: {os.getcwd()}\n")
        output.write(f"Total files: {len(files)}\n\n")
        
        # Write file tree
        output.write("## Project Structure\n\n")
        output.write("```\n")
        for line in tree_lines:
            output.write(line + "\n")
        output.write("```\n\n")
        
        # Write file contents
        output.write("## File Contents\n\n")
        
        for file_path in files:
            relative_path = file_path.relative_to(root_path)
            print(f"📄 Processing: {relative_path}")
            
            # Write file header
            output.write(f"### {relative_path}\n\n")
            
            # Read and write file content
            content = read_file_content(file_path)
            
            # Determine file extension for syntax highlighting
            suffix = file_path.suffix.lower()
            
            # Map file extensions to markdown code block languages
            language_map = {
                '.py': 'python',
                '.js': 'javascript',
                '.ts': 'typescript',
                '.html': 'html',
                '.css': 'css',
                '.json': 'json',
                '.md': 'markdown',
                '.yml': 'yaml',
                '.yaml': 'yaml',
                '.xml': 'xml',
                '.sh': 'bash',
                '.sql': 'sql',
                '.php': 'php',
                '.rb': 'ruby',
                '.go': 'go',
                '.java': 'java',
                '.cpp': 'cpp',
                '.c': 'c',
                '.txt': 'text',
            }
            
            language = language_map.get(suffix, 'text')
            
            # Write content in code block with proper syntax highlighting
            output.write(f"```{language}\n")
            output.write(content)
            if not content.endswith('\n'):
                output.write('\n')
            output.write("```\n\n")
            
            # Add XML-style tags as requested
            output.write(f"<file path='{relative_path}' size='{len(content)} characters'></file>\n\n")
            output.write("---\n\n")
    
    print(f"✅ Snapshot complete! Check 'snapshot.md' in your project folder.")
    print(f"📊 Included {len(files)} files in the snapshot.")

if __name__ == "__main__":
    """
    This block runs when you execute the script directly.
    It calls our main function to create the snapshot.
    """
    try:
        create_snapshot()
    except KeyboardInterrupt:
        print("\n❌ Snapshot cancelled by user")
    except Exception as e:
        print(f"❌ Error creating snapshot: {e}")
        print("💡 Make sure you're in the right directory and have write permissions")
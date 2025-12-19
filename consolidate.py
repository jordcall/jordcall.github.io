#!/usr/bin/env python3
"""
File Consolidator for Replit Projects
======================================

This script scans your Replit project directory and combines all files into
a single text file for easy sharing or backup purposes.

USAGE:
    python consolidate.py

OUTPUT:
    Creates a file named 'project_backup.txt' in the current directory
    containing all your project files with clear separators.

HOW IT WORKS:
    1. Scans the current directory and all subdirectories
    2. Filters out unnecessary files (git files, cache, etc.)
    3. Reads each file and adds it to the output with headers
    4. Creates a table of contents at the beginning
"""

import os
from pathlib import Path
from datetime import datetime


# List of directories and files to exclude from the consolidation
# These are common development artifacts that don't need to be backed up
EXCLUDED_DIRS = {
    '.git',           # Git version control
    '__pycache__',    # Python cache files
    'node_modules',   # Node.js dependencies
    'venv',           # Python virtual environment
    'env',            # Alternative virtual environment name
    '.venv',          # Hidden virtual environment
    'dist',           # Build distributions
    'build',          # Build artifacts
    '.next',          # Next.js build files
    '.cache',         # General cache directories
    'coverage',       # Test coverage reports
}

EXCLUDED_FILES = {
    '.DS_Store',          # macOS system file
    'project_backup.txt', # Don't include previous backups
}

# File extensions that should be treated as binary and skipped
BINARY_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',  # Images
    '.mp3', '.mp4', '.wav', '.avi', '.mov',                   # Media
    '.zip', '.tar', '.gz', '.rar', '.7z',                     # Archives
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',                 # Documents
    '.exe', '.bin', '.dat',                                   # Executables/Binary
    '.pyc', '.pyo',                                           # Python compiled
    '.so', '.dylib', '.dll',                                  # Shared libraries
}


def should_exclude_file(file_path):
    """
    Determine if a file should be excluded from the consolidation.
    
    Args:
        file_path: Path object representing the file
        
    Returns:
        True if the file should be excluded, False otherwise
    """
    # Check if filename is in excluded list
    if file_path.name in EXCLUDED_FILES:
        return True
    
    # Check if file has a binary extension
    if file_path.suffix.lower() in BINARY_EXTENSIONS:
        return True
    
    # Check if any parent directory is in the excluded list
    for parent in file_path.parents:
        if parent.name in EXCLUDED_DIRS:
            return True
    
    return False


def get_all_files(root_dir):
    """
    Recursively find all files in the project directory.
    
    Args:
        root_dir: Path object representing the root directory to scan
        
    Returns:
        List of Path objects for all files that should be included
    """
    all_files = []
    
    # Walk through all directories and files
    for item in root_dir.rglob('*'):
        # Skip directories, we only want files
        if item.is_dir():
            continue
        
        # Skip excluded files
        if should_exclude_file(item):
            continue
        
        all_files.append(item)
    
    # Sort files for consistent output
    all_files.sort()
    
    return all_files


def read_file_safely(file_path):
    """
    Attempt to read a file, handling encoding issues gracefully.
    
    Args:
        file_path: Path object representing the file to read
        
    Returns:
        Tuple of (success: bool, content: str)
    """
    # Try different encodings
    encodings = ['utf-8', 'latin-1', 'cp1252']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()
                return True, content
        except (UnicodeDecodeError, PermissionError):
            continue
        except Exception as e:
            return False, f"Error reading file: {str(e)}"
    
    # If all encodings failed, treat as binary
    return False, "[Binary or unreadable file - skipped]"


def create_consolidated_file(output_filename='project_backup.txt'):
    """
    Main function to create the consolidated backup file.
    
    Args:
        output_filename: Name of the output file (default: project_backup.txt)
    """
    print("=" * 70)
    print("FILE CONSOLIDATOR - Replit Project Backup Tool")
    print("=" * 70)
    print()
    
    # Get the current directory
    root_dir = Path.cwd()
    print(f"📁 Scanning directory: {root_dir}")
    print()
    
    # Find all files to include
    files_to_process = get_all_files(root_dir)
    print(f"✓ Found {len(files_to_process)} files to consolidate")
    print()
    
    # Create the output file
    with open(output_filename, 'w', encoding='utf-8') as output:
        # Write header
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        output.write("=" * 70 + "\n")
        output.write("REPLIT PROJECT BACKUP\n")
        output.write("=" * 70 + "\n")
        output.write(f"Created: {timestamp}\n")
        output.write(f"Project Directory: {root_dir}\n")
        output.write(f"Total Files: {len(files_to_process)}\n")
        output.write("=" * 70 + "\n\n")
        
        # Write table of contents
        output.write("TABLE OF CONTENTS\n")
        output.write("-" * 70 + "\n")
        for idx, file_path in enumerate(files_to_process, 1):
            rel_path = file_path.relative_to(root_dir)
            output.write(f"{idx:3d}. {rel_path}\n")
        output.write("\n" + "=" * 70 + "\n\n")
        
        # Process each file
        successful = 0
        skipped = 0
        
        for idx, file_path in enumerate(files_to_process, 1):
            rel_path = file_path.relative_to(root_dir)
            
            print(f"Processing [{idx}/{len(files_to_process)}]: {rel_path}")
            
            # Write file header
            output.write("\n" + "=" * 70 + "\n")
            output.write(f"FILE: {rel_path}\n")
            output.write("=" * 70 + "\n")
            output.write(f"Path: {file_path}\n")
            
            # Get file size
            try:
                size = file_path.stat().st_size
                output.write(f"Size: {size:,} bytes\n")
            except:
                output.write("Size: Unknown\n")
            
            output.write("-" * 70 + "\n\n")
            
            # Read and write file content
            success, content = read_file_safely(file_path)
            
            if success:
                output.write(content)
                successful += 1
            else:
                output.write(content)  # Write error message
                skipped += 1
            
            output.write("\n\n")
        
        # Write footer
        output.write("\n" + "=" * 70 + "\n")
        output.write("END OF BACKUP\n")
        output.write("=" * 70 + "\n")
        output.write(f"Successfully processed: {successful} files\n")
        output.write(f"Skipped: {skipped} files\n")
        output.write(f"Total: {len(files_to_process)} files\n")
    
    print()
    print("=" * 70)
    print("✅ CONSOLIDATION COMPLETE!")
    print("=" * 70)
    print(f"📄 Output file: {output_filename}")
    print(f"✓ Successfully processed: {successful} files")
    print(f"⚠ Skipped: {skipped} files")
    print(f"📊 Total: {len(files_to_process)} files")
    print()
    print(f"You can now share or backup the file: {output_filename}")
    print()


if __name__ == "__main__":
    # Run the consolidation
    create_consolidated_file()

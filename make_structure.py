import os

# Define the folder structure and files to create
# Folders are keys, and the values are lists of empty files to put inside them
project_structure = {
    "config": ["db.js"],
    "controllers": ["authController.js", "rewardController.js"],
    "models": ["User.js"],
    "routes": ["api.js", "auth.js"],
    "data": ["database.json"],
    "public": ["index.html", "tasks.html", "redeem.html"],
    "public/css": ["style.css"],
    "public/js": ["dashboard.js", "tasks.js"],
    "": [".gitignore"] # Root directory files
}

def create_structure():
    current_dir = os.getcwd()
    print(f"📁 Creating MVC architecture inside: {current_dir}\n")
    
    for folder, files in project_structure.items():
        # Create folder path if it's not the root directory
        if folder:
            folder_path = os.path.join(current_dir, folder)
            os.makedirs(folder_path, exist_ok=True)
            print(f"✔ Created Folder: {folder}")
        
        # Create empty files inside the target folder
        for file in files:
            file_path = os.path.join(current_dir, folder, file)
            
            # Use 'w' mode to create the file if it doesn't exist without destroying existing ones
            if not os.path.exists(file_path):
                with open(file_path, 'w', encoding='utf-8') as f:
                    pass # Just create empty file
                print(f"  └── 📄 Created File: {file}")
            else:
                print(f"  └── ⚡ File already exists (Skipped): {file}")

if __name__ == "__main__":
    create_structure()
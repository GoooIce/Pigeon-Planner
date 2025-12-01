
import os
import sys
import glob
import shutil
import zipfile
import subprocess

sys.path.insert(0, os.path.abspath(".."))
from pigeonplanner.core.const import VERSION


package_root = '..\\dist\\'
if not os.path.exists(package_root):
    print("Dist directory not found. Did you py2exe'd?")
    sys.exit()

python_root = os.path.dirname(sys.executable) + "\\"
gtk_root = python_root + "Lib\\site-packages\\gtk-2.0\\runtime\\"

# Copy the required theme files
theme_files = [("etc\\gtk-2.0\\", "gtkrc"),
               ("lib\\gtk-2.0\\2.10.0\\engines\\", "libclearlooks.dll"),
        ]
for theme_path, theme_file in theme_files:
    dist_theme_path = package_root+theme_path
    if not os.path.exists(dist_theme_path):
        os.makedirs(dist_theme_path)
    shutil.copyfile(gtk_root+theme_path+theme_file, dist_theme_path+theme_file)

# Only copy GTK+ translations for the languages used inside Pigeon Planner
#TODO: only copy gtk20.mo?
langs = os.listdir(package_root+"languages")
for lang in langs:
    try:
        shutil.copytree(gtk_root+"share\\locale\\"+lang,
                        package_root+"share\\locale\\"+lang)
    except WindowsError:
        pass

# Copy intl.dll from GTK+ to avoid problems
shutil.copy(gtk_root+"bin\\intl.dll", package_root+"lib")

# Find the mvcr90.dll and approriate manifest
#TODO: This only works on Windows XP probably
dll_version = "9.0.21022.8"
dlls_dir = "C:\\WINDOWS\\WinSxS\\"
manifests_dir = dlls_dir + "Manifests\\"

for manifest in glob.glob(manifests_dir + "*.manifest"):
    if "Microsoft.VC90.CRT" in manifest and dll_version in manifest:
        shutil.copy(manifest, package_root + "Microsoft.VC90.CRT.manifest")
        break
for dll_dir in os.listdir(dlls_dir):
    if "Microsoft.VC90.CRT" in dll_dir and dll_version in dll_dir:
        dll = dlls_dir + dll_dir + "\\msvcr90.dll"
        shutil.copy(dll, package_root)
        break

# Call the InnoSetup compiler to create the setup file
iss_compiler = "C:\\Program Files\\Inno Setup 5\\ISCC.exe"
subprocess.call([iss_compiler, "/cc", "setup.iss"])

# Create a portable zip package
ziproot = "Pigeon Planner %s" % VERSION
zfile = zipfile.ZipFile('pigeonplanner-%s-win32.zip' % VERSION, 'w', zipfile.ZIP_DEFLATED)
for root, dirs, files in os.walk(package_root):
    for file in files:
        filepath = os.path.join(root, file)
        zfile.write(filepath, filepath.replace("..\\dist", ziproot))
zfile.close()


#!/usr/bin/env python
# -*- coding: utf-8 -*-

# This file is part of Pigeon Planner.

# Pigeon Planner is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Pigeon Planner is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Pigeon Planner.  If not, see <http://www.gnu.org/licenses/>


import os
import os.path
import glob
import subprocess
from optparse import OptionParser


POTFILE = "po/pigeonplanner.pot"
POTFILES = {"Python": "po/POTFILES_PY.in",
            "Glade": "po/POTFILES_GLADE.in"}
FORMATS = {"Python": [('bin', None),
                      ('pigeonplanner', ['.py'])],
           "Glade": [('glade', ['.ui']),
                     ('data', ['.ui'])]}
GLADE_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<interface>
  <object class="GtkDialog" id="dialog1">
%s
  </object>
</interface>"""


def _get_files(folder, ext=None):
    files = []
    for dirpath, dirnames, filenames in os.walk(folder):
        for filename in filenames:
            if ext is not None:
                if not os.path.splitext(filename)[1] in ext:
                    continue
            files.append(os.path.join(dirpath, filename))
    return files

def create_potfiles_in():
    """
    Create a file for each format type that contains the file paths that will
    be searched for translatable strings.
    """

    for format, folders in FORMATS.items():
        potfile = POTFILES[format]
        print "Creating %s" %potfile
        to_translate = []
        for folder, ext in folders:
            to_translate.extend(_get_files(folder, ext))

        f = open(potfile, "wb")
        for line in to_translate:
            f.write(line + "\n")
        f.close()

def create_potfile():
    """
    Create a potfile from all strings found in the files given in the
    potfile.in files.
    """

    if not os.path.exists(POTFILE):
        # We need to make sure this file exists because we use the
        # join argument (-j) with xgettext.
        f = open(POTFILE, 'w')
        f.close()
    for format, potfile in POTFILES.items():
        cmd = ['xgettext', '-j', '--language', format, '-f', potfile, '-o', POTFILE]
        subprocess.call(cmd)

def create_mo():
    """
    Compile the mo-files for each po-file if it doesn't exist already or if
    the po-file was updated.
    """

    po_dir = os.path.join(os.path.dirname(__file__), 'po/')
    for path, names, filenames in os.walk(po_dir):
        for filename in filenames:
            if not filename.endswith('.po'): continue
            lang = os.path.splitext(filename)[0]
            src = os.path.join(path, filename)
            dest_path = os.path.join('languages', lang, 'LC_MESSAGES')
            dest = os.path.join(dest_path, 'pigeonplanner.mo')
            if not os.path.exists(dest_path):
                os.makedirs(dest_path)
            if not os.path.exists(dest):
                print('Compiling %s' %src)
                subprocess.call(["msgfmt", src, "-o", dest])
            else:
                src_mtime = os.stat(src)[8]
                dest_mtime = os.stat(dest)[8]
                if src_mtime > dest_mtime:
                    print('Compiling %s' %src)
                    subprocess.call(["msgfmt", src, "-o", dest])

def bug_workaround():
    # There's a bug in xgettext which doesn't extract translatable rows added
    # to a liststore in Glade. Like the following:
    #  <object class="GtkListStore" id="liststore1">
    #    <columns>
    #      <!-- column-name item -->
    #      <column type="gchararray"/>
    #    </columns>
    #    <data>
    #      <row>
    #        <col id="0" translatable="yes">Spam</col>
    #      </row>
    #      <row>
    #        <col id="0" translatable="yes">Eggs</col>
    #      </row>
    #    </data>
    #  </object>
    # Bugreport: https://savannah.gnu.org/bugs/index.php?29216
    #
    # We're going to extract these fields ourself and create a new Glade file
    # with the same strings, but in a field xgettext does parse.

    import xml.etree.ElementTree as ET

    corrected = []
    for gladefile in glob.glob("glade/*.ui"):
        tree = ET.parse(gladefile)
        root = tree.getroot()
        for col in root.iter('col'):
            if col.attrib["translatable"] == "yes":
                corrected.append('    <property translatable="yes">%s</property>'
                                 % col.text)

    twfile = open("data/TranslationWorkaround.ui", "w")
    twfile.write(GLADE_TEMPLATE % '\n'.join(corrected))
    twfile.close()

def main():
    parser = OptionParser()
    parser.add_option("-p", "--create-pot",
                      action="store_true", dest="pot", default=False,
                      help="Create a new pot-file", metavar="FILE")
    parser.add_option("-m", "--create_mo",
                      action="store_true", dest="mo", default=False,
                      help="Compile mo-files if the po-file was changed")
    options, args = parser.parse_args()
    if options.pot:
        # Remove existing pot-file to start with a clean template.
        try:
            os.remove(POTFILE)
        except:
            pass
        bug_workaround()
        create_potfiles_in()
        create_potfile()
    if options.mo:
        create_mo()

if __name__ == "__main__":
    main()


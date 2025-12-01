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

import gtk
import glib

from pigeonplanner import mime
from pigeonplanner.core import const


LAST_FOLDER = None


#### Main filechooser
class _FileChooser(gtk.FileChooser):
    def _update_preview_cb(self, filechooser):
        filename = filechooser.get_preview_filename()
        try:
            pixbuf = gtk.gdk.pixbuf_new_from_file_at_size(filename, 128, 128)
            self.preview_image.set_from_pixbuf(pixbuf)
        except:
            mimetype = mime.get_type(filename)
            try:
                image = mime.get_pixbuf(mimetype)
                self.preview_image.set_from_pixbuf(image)
            except mime.MimeIconError:
                if filename is None: return
                stock = gtk.STOCK_FILE
                if os.path.isdir(filename):
                    stock = gtk.STOCK_DIRECTORY
                self.preview_image.set_from_stock(stock, gtk.ICON_SIZE_DIALOG)
        filechooser.set_preview_widget_active(True)

    def _create_preview_widget(self):
        self.preview_image = gtk.Image()
        frame = gtk.Frame(_("Preview"))
        frame.set_shadow_type(gtk.SHADOW_ETCHED_IN)
        frame.add(self.preview_image)
        frame.show_all()
        return frame

    def set_preview(self, value):
        if not value: return
        self.connect("update-preview", self._update_preview_cb)
        self.set_preview_widget(self._create_preview_widget())
        self.set_use_preview_label(False)

    def get_filename(self):
        filename = gtk.FileChooser.get_filename(self)
        # filename is None when no file is selected. So prevent returning
        # u"None" by only converting when needed.
        if filename is not None:
            return unicode(filename)

    def get_current_folder(self):
        return unicode(gtk.FileChooser.get_current_folder(self))

    def add_image_filter(self):
        filter_ = gtk.FileFilter()
        filter_.set_name(_("Images"))
        filter_.add_pixbuf_formats()
        self.add_filter(filter_)

    def add_pdf_filter(self):
        filter_ = gtk.FileFilter()
        filter_.set_name("PDF")
        filter_.add_pattern("*.pdf")
        self.add_filter(filter_)

    def add_text_filter(self):
        filter_ = gtk.FileFilter()
        filter_.set_name("Text (.txt)")
        filter_.add_pattern("*.txt")
        filter_.add_pattern("*.TXT")
        self.add_filter(filter_)

    def add_backup_filter(self):
        filter_ = gtk.FileFilter()
        filter_.set_name("PP Backups")
        filter_.add_mime_type("zip/zip")
        filter_.add_pattern("*PigeonPlannerBackup.zip")
        self.add_filter(filter_)

    def add_custom_filter(self, filter_):
        class Filter(gtk.FileFilter):
            def __init__(self, name, pattern):
                gtk.FileFilter.__init__(self)
                self.set_name(name)
                self.add_pattern(pattern)
        name, pattern = filter_
        filefilter = Filter(name, pattern)
        self.add_filter(filefilter)


#### Dialogs
class _FileChooserDialog(gtk.FileChooserDialog, _FileChooser):
    def __init__(self, parent=None, folder=const.HOMEDIR,
                       action=gtk.FILE_CHOOSER_ACTION_OPEN, preview=True):
        super(_FileChooserDialog, self).__init__(parent=parent, action=action)
        self.add_button(gtk.STOCK_CANCEL, gtk.RESPONSE_CANCEL)
        self.set_preview(preview)
        if LAST_FOLDER is not None:
            folder = LAST_FOLDER
        if folder is None:
            folder = const.HOMEDIR
        self.set_current_folder(folder)

    def do_response(self, response):
        if response == gtk.RESPONSE_OK:
            global LAST_FOLDER
            LAST_FOLDER = self.get_current_folder()


class ImageChooser(_FileChooserDialog):

    __gtype_name__ = "ImageChooser"

    RESPONSE_CLEAR = -40
    def __init__(self, parent):
        super(ImageChooser, self).__init__(parent, glib.get_user_special_dir(
                                                glib.USER_DIRECTORY_PICTURES))
        self.set_title(_("Select an image..."))
        self.add_image_filter()
        image = gtk.image_new_from_stock(gtk.STOCK_CLEAR, gtk.ICON_SIZE_BUTTON)
        buttonclear = self.add_button(_("No image"), self.RESPONSE_CLEAR)
        buttonclear.set_image(image)
        self.add_button(gtk.STOCK_OK, gtk.RESPONSE_OK)


class MediaChooser(_FileChooserDialog):

    __gtype_name__ = "MediaChooser"

    def __init__(self, parent):
        super(MediaChooser, self).__init__(parent)
        self.connect("selection-changed", self._selection_changed_cb)
        self.set_title(_("Select a file..."))
        self.add_button(gtk.STOCK_OK, gtk.RESPONSE_OK)
        self.set_extra_widget(self._create_extra_widget())

    def _selection_changed_cb(self, filechooser):
        fname = self.get_filename()
        if fname is None: return
        self.entrytitle.set_text(os.path.splitext(os.path.basename(fname))[0])

    def _create_extra_widget(self):
        labeltitle = gtk.Label(_("Title"))
        labeltitle.set_alignment(0, .5)
        self.entrytitle = gtk.Entry()

        labeldesc = gtk.Label(_("Description"))
        labeldesc.set_alignment(0, .5)
        self.entrydescription = gtk.Entry()

        table = gtk.Table(2, 2, False)
        table.set_row_spacings(4)
        table.set_col_spacings(8)
        table.attach(labeltitle, 0, 1, 0, 1, gtk.FILL, 0)
        table.attach(self.entrytitle, 1, 2, 0, 1)
        table.attach(labeldesc, 0, 1, 1, 2, gtk.FILL, 0)
        table.attach(self.entrydescription, 1, 2, 1, 2)
        table.show_all()
        return table

    def get_filetitle(self):
        return self.entrytitle.get_text()

    def get_filedescription(self):
        return self.entrydescription.get_text()

    def get_filetype(self):
        return mime.get_type(self.get_filename())


class PdfSaver(_FileChooserDialog):

    __gtype_name__ = "PdfSaver"

    def __init__(self, parent, pdf_name):
        super(PdfSaver, self).__init__(parent, preview=False,
                                       action=gtk.FILE_CHOOSER_ACTION_SAVE)
        self.set_title(_("Save as..."))
        self.add_pdf_filter()
        self.add_button(gtk.STOCK_SAVE, gtk.RESPONSE_OK)
        self.set_current_name(pdf_name)


class ExportChooser(_FileChooserDialog):

    __gtype_name__ = "ExportChooser"

    def __init__(self, parent, filename, filter_):
        super(ExportChooser, self).__init__(parent, preview=False,
                                            action=gtk.FILE_CHOOSER_ACTION_SAVE)
        self.set_title(_("Save as..."))
        self.add_custom_filter(filter_)
        self.add_button(gtk.STOCK_SAVE, gtk.RESPONSE_OK)
        self.set_current_name(filename)


#### Buttons
class _FileChooserButton(gtk.FileChooserButton, _FileChooser):
    def __init__(self, folder=const.HOMEDIR,
                       action=gtk.FILE_CHOOSER_ACTION_OPEN, preview=True):
        super(_FileChooserButton, self).__init__("")
        self.set_current_folder(folder)
        self.set_preview(preview)
        self.set_action(action)


class ResultChooser(_FileChooserButton):

    __gtype_name__ = "ResultChooser"

    def __init__(self):
        super(ResultChooser, self).__init__(preview=False)
        self.set_title(_("Select a file..."))
        self.add_text_filter()


class BackupSaver(_FileChooserButton):

    __gtype_name__ = "BackupSaver"

    def __init__(self):
        super(BackupSaver, self).__init__(preview=False,
                                action=gtk.FILE_CHOOSER_ACTION_SELECT_FOLDER)
        self.set_title(_("Select a folder..."))


class BackupChooser(_FileChooserButton):

    __gtype_name__ = "BackupChooser"

    def __init__(self):
        super(BackupChooser, self).__init__(preview=False)
        self.set_title(_("Select a file..."))
        self.add_backup_filter()


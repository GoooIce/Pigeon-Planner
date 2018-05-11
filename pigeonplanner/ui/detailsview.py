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


import logging
logger = logging.getLogger(__name__)

import gtk
import gtk.gdk
import gobject

from pigeonplanner import messages
from pigeonplanner import thumbnail
from pigeonplanner import database
from pigeonplanner.ui import tools
from pigeonplanner.ui import utils
from pigeonplanner.ui import builder
from pigeonplanner.ui import component
from pigeonplanner.ui import filechooser
from pigeonplanner.ui.widgets import date
from pigeonplanner.ui.widgets import sexentry
from pigeonplanner.ui.widgets import bandentry
from pigeonplanner.ui.messagedialog import ErrorDialog, WarningDialog
from pigeonplanner.core import enums
from pigeonplanner.core import const
from pigeonplanner.core import common
from pigeonplanner.core import errors
from pigeonplanner.core import pigeonparser
from pigeonplanner.core import pigeon as corepigeon


RESPONSE_EDIT = 10
RESPONSE_SAVE = 12


class DetailsDialog(gtk.Dialog):
    def __init__(self, pigeon=None, parent=None, mode=None):
        gtk.Dialog.__init__(self, None, parent, gtk.DIALOG_MODAL)
        if pigeon is None:
            title = _("Details of pigeon")
        else:
            title = _("Details of %s") %pigeon.get_band_string()
        self.set_title(title)
        self.set_resizable(False)
        if parent is None:
            self.set_position(gtk.WIN_POS_MOUSE)

        self.details = DetailsView(self)
        self.vbox.pack_start(self.details.get_root_widget(), False, False)
        if mode == enums.Action.add:
            self.details.clear_details()
        else:
            self.details.set_details(pigeon)
        if mode in (enums.Action.edit, enums.Action.add):
            self.details.start_edit(mode)
            self.add_buttons(gtk.STOCK_CANCEL, gtk.RESPONSE_CANCEL,
                             gtk.STOCK_SAVE, RESPONSE_SAVE)
            self.set_default_response(RESPONSE_SAVE)
        else:
            self.add_buttons(gtk.STOCK_CLOSE, gtk.RESPONSE_CLOSE)
            self.set_default_response(gtk.RESPONSE_CLOSE)
        self.run()

    def run(self):
        self.connect("response", self.on_dialog_response)
        self.show_all()

    def on_dialog_response(self, dialog, response_id):
        keep_alive = False
        if response_id in (gtk.RESPONSE_CLOSE, gtk.RESPONSE_DELETE_EVENT):
            pass
        elif response_id == RESPONSE_SAVE:
            keep_alive = self.details.operation_saved()
        elif response_id == gtk.RESPONSE_CANCEL:
            self.details.operation_cancelled()

        if not keep_alive:
            dialog.destroy()


class PigeonImageWidget(gtk.EventBox):
    def __init__(self, editable, view, parent=None):
        gtk.EventBox.__init__(self)
        if editable:
            self.connect("button-press-event", self.on_editable_button_press_event)
        else:
            self.connect("button-press-event", self.on_button_press_event)

        self._view = view
        self._parent = parent
        self._imagewidget = gtk.Image()
        self._imagewidget.set_size_request(200, 200)
        self.add(self._imagewidget)
        self._imagepath = ""
        self.set_default_image()

    def on_button_press_event(self, widget, event):
        if self._view.pigeon is None:
            return
        parent = None if isinstance(self._parent, gtk.Dialog) else self._parent
        tools.PhotoAlbum(parent, self._view.pigeon.get_pindex())

    def on_editable_button_press_event(self, widget, event):
        if event.button == 3:
            entries = [
                (gtk.STOCK_ADD, self.on_open_imagechooser, None, None),
                (gtk.STOCK_REMOVE, self.set_default_image, None, None)]
            utils.popup_menu(event, entries)
        else:
            self.on_open_imagechooser()

    def on_open_imagechooser(self, widget=None):
        chooser = filechooser.ImageChooser(self._parent)
        response = chooser.run()
        if response == gtk.RESPONSE_OK:
            filename = chooser.get_filename()
            try:
                pb = gtk.gdk.pixbuf_new_from_file_at_size(filename, 200, 200)
            except gobject.GError as exc:
                logger.error("Can't set image '%s':%s", filename, exc)
                ErrorDialog(messages.MSG_INVALID_IMAGE, self._parent)
            else:
                self._imagewidget.set_from_pixbuf(pb)
                self._imagepath = filename
        elif response == chooser.RESPONSE_CLEAR:
            self.set_default_image()
        chooser.destroy()

    def set_default_image(self, widget=None):
        logo = gtk.gdk.pixbuf_new_from_file_at_size(const.LOGO_IMG, 75, 75)
        self._imagewidget.set_from_pixbuf(logo)
        self._imagepath = ""

    def set_image(self, path=""):
        if path:
            pixbuf = thumbnail.get_image(path)
        else:
            pixbuf = gtk.gdk.pixbuf_new_from_file_at_size(const.LOGO_IMG, 75, 75)
        self._imagewidget.set_from_pixbuf(pixbuf)
        self._imagepath = path

    def get_image_path(self):
        return self._imagepath


class DetailsView(builder.GtkBuilder, gobject.GObject, component.Component):
    __gsignals__ = {"edit-finished": (gobject.SIGNAL_RUN_LAST,
                                      None, (object, int)),
                    "edit-cancelled": (gobject.SIGNAL_RUN_LAST,
                                       None, ()),
                    }
    def __init__(self, parent=None, register=False):
        builder.GtkBuilder.__init__(self, "DetailsView.ui")
        gobject.GObject.__init__(self)
        if register:
            component.Component.__init__(self, "DetailsView")

        self.parent = parent or component.get("MainWindow")
        self.pedigree_mode = False
        self.pigeon = None
        self.child = None

        self.widgets.pigeonimage = PigeonImageWidget(False, self, parent)
        self.widgets.viewportImage.add(self.widgets.pigeonimage)
        self.widgets.pigeonimage_edit = PigeonImageWidget(True, self, parent)
        self.widgets.viewportImageEdit.add(self.widgets.pigeonimage_edit)

        self.widgets.combocolour.set_data(database.get_all_data(database.Tables.COLOURS), sort=False)
        self.widgets.combostrain.set_data(database.get_all_data(database.Tables.STRAINS), sort=False)
        self.widgets.comboloft.set_data(database.get_all_data(database.Tables.LOFTS), sort=False)

        self.widgets.combostatus.set_active(1)
        self.widgets.combostatus.emit("changed")

        self.widgets.statusdialog.set_transient_for(parent)
        self.widgets.root.show_all()

    # Callbacks
    ## Status
    def on_buttonstatus_clicked(self, widget):
        if self.pigeon is None: return
        self.widgets.labelstatus.set_markup("<b>%s</b>" % self.pigeon.get_status())
        self.widgets.notebookstatus.set_current_page(self.pigeon.get_active())
        self._set_status_editable(False)
        self.widgets.hboxstatusedit.hide()
        self.widgets.hboxstatusnormal.show()
        self.widgets.statusdialog.show()
        self.widgets.buttonstatusok.grab_focus()

    def on_buttonstatusedit_clicked(self, widget):
        self._set_status_editable(True)
        self.widgets.hboxstatusedit.show()
        self.widgets.hboxstatusnormal.hide()
        self.widgets.statusdialog.show()

    def on_combostatus_changed(self, widget):
        status = widget.get_active()
        self.widgets.notebookstatus.set_current_page(status)
        self._set_status_button(status)

    def on_statusdialog_close(self, widget, event=None):
        page = self.widgets.notebookstatus.get_current_page()
        table = self.widgets.notebookstatus.get_nth_page(page)
        for child in table.get_children():
            if isinstance(child, date.DateEntry):
                try:
                    # Just check the date, the value is used elsewhere
                    child.get_text()
                except errors.InvalidInputError as msg:
                    ErrorDialog(msg.value, self.parent)
                    return True
        self.widgets.statusdialog.hide()
        return True

    def on_entrysireedit_search_clicked(self, widget):
        return self._get_pigeonsearch_details(enums.Sex.cock)

    def on_entrydamedit_search_clicked(self, widget):
        return self._get_pigeonsearch_details(enums.Sex.hen)

    def on_entrypartnerwidow_search_clicked(self, widget):
        return None, enums.Sex.cock, None

    # Public methods
    def get_root_widget(self):
        return self.widgets.root

    def get_child(self):
        return self.child

    def set_child(self, child):
        self.child = child

    def get_pedigree_mode(self):
        return self.pedigree_mode

    def set_pedigree_mode(self, mode):
        self.pedigree_mode = mode
        self.widgets.combosex.set_sensitive(not mode)

    def set_sex(self, value):
        self.widgets.combosex.set_active(value)

    def set_details(self, pigeon):
        if pigeon is None:
            self.widgets.errorlabel.show()
            self.widgets.detailbook.set_sensitive(False)
            return

        self.pigeon = pigeon

        self.widgets.entryband.set_band(*pigeon.get_band())
        self.widgets.entrysire.set_band(*pigeon.get_sire())
        self.widgets.entrydam.set_band(*pigeon.get_dam())
        self.widgets.entrysex.set_sex(pigeon.get_sex())
        self.widgets.entrystrain.set_text(pigeon.get_strain())
        self.widgets.entryloft.set_text(pigeon.get_loft())
        self.widgets.entrycolour.set_text(pigeon.get_colour())
        self.widgets.entryname.set_text(pigeon.get_name())
        extra1, extra2, extra3, extra4, extra5, extra6 = pigeon.get_extra()
        self.widgets.entryextra1.set_text(extra1)
        self.widgets.entryextra2.set_text(extra2)
        self.widgets.entryextra3.set_text(extra3)
        self.widgets.entryextra4.set_text(extra4)
        self.widgets.entryextra5.set_text(extra5)
        self.widgets.entryextra6.set_text(extra6)

        self._set_status(pigeon.get_pindex(), pigeon.get_active())

        self.widgets.pigeonimage.set_image(pigeon.get_image())

    def get_edit_details(self):
        ring, year = self.widgets.entrybandedit.get_band()
        ringsire, yearsire = self.widgets.entrysireedit.get_band()
        ringdam, yeardam = self.widgets.entrydamedit.get_band()
        if self.pigeon is None:
            show = 0 if self.pedigree_mode else 1
        else:
            show = self.pigeon.get_visible()
        data = {"band": ring, "year": year, "show": show,
                "sire": ringsire, "yearsire": yearsire,
                "dam": ringdam, "yeardam": yeardam,
                "sex": self.widgets.combosex.get_sex(),
                "active": self.widgets.combostatus.get_active(),
                "colour": self.widgets.combocolour.child.get_text(),
                "name": self.widgets.entrynameedit.get_text(),
                "strain": self.widgets.combostrain.child.get_text(),
                "loft": self.widgets.comboloft.child.get_text(),
                "image": self.widgets.pigeonimage_edit.get_image_path(),
                "extra1": self.widgets.entryextraedit1.get_text(),
                "extra2": self.widgets.entryextraedit2.get_text(),
                "extra3": self.widgets.entryextraedit3.get_text(),
                "extra4": self.widgets.entryextraedit4.get_text(),
                "extra5": self.widgets.entryextraedit5.get_text(),
                "extra6": self.widgets.entryextraedit6.get_text()}
        return data

    def clear_details(self):
        self.widgets.entryband.clear()
        self.widgets.entrybandedit.clear()
        self.widgets.entrysire.clear()
        self.widgets.entrysireedit.clear()
        self.widgets.entrydam.clear()
        self.widgets.entrydamedit.clear()

        self.widgets.combocolour.child.set_text("")
        self.widgets.combostrain.child.set_text("")
        self.widgets.comboloft.child.set_text("")
        self.widgets.combosex.set_active(0)
        self.widgets.combostatus.set_active(1)
        self.widgets.combostatus.emit("changed")

        self.widgets.pigeonimage.set_default_image()

        for entry in self.get_objects_from_prefix("entry"):
            if isinstance(entry, bandentry.BandEntry): continue
            if isinstance(entry, date.DateEntry): continue
            if isinstance(entry, sexentry.SexEntry):
                entry.set_sex(None)
                continue
            entry.set_text("")
        for text in self.get_objects_from_prefix("text"):
            text.get_buffer().set_text("")

    def start_edit(self, operation):
        self._operation = operation
        if operation == enums.Action.edit:
            logger.debug("Start editing pigeon '%s'", self.pigeon.get_pindex())
            self.widgets.entrybandedit.set_band(
                                *self.widgets.entryband.get_band(validate=False))
            self.widgets.entrysireedit.set_band(
                                *self.widgets.entrysire.get_band(validate=False))
            self.widgets.entrydamedit.set_band(
                                *self.widgets.entrydam.get_band(validate=False))
            self.widgets.entrynameedit.set_text(self.widgets.entryname.get_text())
            self.widgets.entryextraedit1.set_text(self.widgets.entryextra1.get_text())
            self.widgets.entryextraedit2.set_text(self.widgets.entryextra2.get_text())
            self.widgets.entryextraedit3.set_text(self.widgets.entryextra3.get_text())
            self.widgets.entryextraedit4.set_text(self.widgets.entryextra4.get_text())
            self.widgets.entryextraedit5.set_text(self.widgets.entryextra5.get_text())
            self.widgets.entryextraedit6.set_text(self.widgets.entryextra6.get_text())
            self.widgets.combocolour.child.set_text(self.widgets.entrycolour.get_text())
            self.widgets.combostrain.child.set_text(self.widgets.entrystrain.get_text())
            self.widgets.comboloft.child.set_text(self.widgets.entryloft.get_text())
            self.widgets.combosex.set_active(self.pigeon.get_sex())

            status = self.pigeon.get_active()
            self.widgets.combostatus.set_active(status)
            self.widgets.notebookstatus.set_current_page(status)

            image = self.widgets.pigeonimage.get_image_path()
            self.widgets.pigeonimage_edit.set_image(image)
        else:
            logger.debug("Start adding a pigeon")

        self.widgets.detailbook.set_current_page(1)
        self.widgets.entrybandedit.grab_focus()

    def operation_saved(self):
        """ Collect pigeon data, save it to the database and do the required
            steps for saving extra data.

            Return True to keep dialog open, False to close it
        """

        try:
            data = self.get_edit_details()
        except errors.InvalidInputError as msg:
            ErrorDialog(msg.value, self.parent)
            return True

        if self._operation == enums.Action.edit:
            pindex = self.pigeon.get_pindex()
            data["pindex"] = common.get_pindex_from_band(data["band"], data["year"])
            status = self.widgets.combostatus.get_active()
            statusdata = self._get_info_for_status(status, pindex)
            try:
                pigeon = corepigeon.update_pigeon(self.pigeon, data, status, statusdata)
            except errors.PigeonAlreadyExists:
                ErrorDialog(messages.MSG_PIGEON_EXISTS, self.parent)
                return False
            except errors.PigeonAlreadyExistsHidden:
                if WarningDialog(messages.MSG_SHOW_PIGEON, self.parent).run():
                    database.update_pigeon(pindex, {"show": 1})
                pigeon = pigeonparser.parser.update_pigeon(pindex)
            except errors.InvalidInputError:
                # This is a corner case. Some status date is incorrect, but the
                # user choose another one. Don't bother him with this.
                pass
        elif self._operation == enums.Action.add:
            pindex = common.get_pindex_from_band(data["band"], data["year"])
            data["pindex"] = pindex
            status = self.widgets.combostatus.get_active()
            statusdata = self._get_info_for_status(status, pindex)
            try:
                pigeon = corepigeon.add_pigeon(data, status, statusdata)
            except errors.PigeonAlreadyExists:
                ErrorDialog(messages.MSG_PIGEON_EXISTS, self.parent)
                return False
            except errors.PigeonAlreadyExistsHidden:
                if WarningDialog(messages.MSG_SHOW_PIGEON, self.parent).run():
                    database.update_pigeon(pindex, {"show": 1})
                pigeon = pigeonparser.parser.update_pigeon(pindex)
            except errors.InvalidInputError:
                # See comment above
                pass

        self.set_details(pigeon)
        self.emit("edit-finished", pigeon, self._operation)
        combodata = [(self.widgets.combocolour, data["colour"]),
                     (self.widgets.combostrain, data["strain"]),
                     (self.widgets.comboloft, data["loft"])]
        for combo, value in combodata:
            combo.add_item(value)
        logger.debug("Operation '%s' finished", self._operation)

        return False

    def operation_cancelled(self):
        logger.debug("Operation '%s' cancelled", self._operation)
        self.emit("edit-cancelled")

    # Internal methods
    def _set_status_button(self, status):
        image = common.STATUS_IMGS[status]
        label = common.get_status(status)
        self.widgets.btnlabelstatus.set_text(label)
        self.widgets.imagestatus.set_from_file(image)
        self.widgets.btnlabelstatusedit.set_text(label)
        self.widgets.imagestatusedit.set_from_file(image)

    def _set_status(self, pindex, status):
        self._set_status_button(status)
        if status == enums.Status.dead:
            data = database.get_status(database.Tables.DEAD, pindex)
            if data:
                self.widgets.entrydatedead.set_text(data["date"])
                self.widgets.textinfodead.get_buffer().set_text(data["info"])
        elif status == enums.Status.sold:
            data = database.get_status(database.Tables.SOLD, pindex)
            if data:
                self.widgets.entrydatesold.set_text(data["date"])
                self.widgets.entrybuyersold.set_text(data["person"])
                self.widgets.textinfosold.get_buffer().set_text(data["info"])
        elif status == enums.Status.lost:
            data = database.get_status(database.Tables.LOST, pindex)
            if data:
                self.widgets.entrydatelost.set_text(data["date"])
                self.widgets.entrypointlost.set_text(data["racepoint"])
                self.widgets.textinfolost.get_buffer().set_text(data["info"])
        elif status == enums.Status.breeder:
            data = database.get_status(database.Tables.BREEDER, pindex)
            if data:
                self.widgets.entrydatebreedfrom.set_text(data["start"])
                self.widgets.entrydatebreedto.set_text(data["end"])
                self.widgets.textinfobreeder.get_buffer().set_text(data["info"])
        elif status == enums.Status.loaned:
            data = database.get_status(database.Tables.LOANED, pindex)
            if data:
                self.widgets.entrydateloan.set_text(data["loaned"])
                self.widgets.entrydateloanback.set_text(data["back"])
                self.widgets.entrypersonloan.set_text(data["person"])
                self.widgets.textinfoloan.get_buffer().set_text(data["info"])
        elif status == enums.Status.widow:
            data = database.get_status(database.Tables.WIDOW, pindex)
            if data:
                self.widgets.entrypartnerwidow.set_pindex(data["partner"])
                self.widgets.textinfowidow.get_buffer().set_text(data["info"])

    def _set_status_editable(self, value):
        def set_editable(widget, value):
            if isinstance(widget, gtk.ScrolledWindow):
                set_editable(widget.get_child(), value)
            if isinstance(widget, bandentry.BandEntry):
                widget.set_has_search(value)
            try:
                widget.set_editable(value)
            except:
                pass
        for table in self.widgets.notebookstatus.get_children():
            table.foreach(set_editable, value)

    def _get_info_for_status(self, status, pindex=None):
        pindex = pindex or self.pigeon.get_pindex()

        if status == enums.Status.dead:
            bffr = self.widgets.textinfodead.get_buffer()
            return {"date": self.widgets.entrydatedead.get_text(),
                    "info": bffr.get_text(*bffr.get_bounds()),
                    "pindex": pindex}

        if status == enums.Status.sold:
            bffr = self.widgets.textinfosold.get_buffer()
            return {"person": self.widgets.entrybuyersold.get_text(),
                    "date": self.widgets.entrydatesold.get_text(),
                    "info": bffr.get_text(*bffr.get_bounds()),
                    "pindex": pindex}

        if status == enums.Status.lost:
            bffr = self.widgets.textinfolost.get_buffer()
            return {"racepoint": self.widgets.entrypointlost.get_text(),
                    "date": self.widgets.entrydatelost.get_text(),
                    "info": bffr.get_text(*bffr.get_bounds()),
                    "pindex": pindex}

        if status == enums.Status.breeder:
            bffr = self.widgets.textinfobreeder.get_buffer()
            return {"start": self.widgets.entrydatebreedfrom.get_text(),
                    "end": self.widgets.entrydatebreedto.get_text(),
                    "info": bffr.get_text(*bffr.get_bounds()),
                    "pindex": pindex}

        if status == enums.Status.loaned:
            bffr = self.widgets.textinfoloan.get_buffer()
            return {"loaned": self.widgets.entrydateloan.get_text(),
                    "back": self.widgets.entrydateloanback.get_text(),
                    "person": self.widgets.entrypersonloan.get_text(),
                    "info": bffr.get_text(*bffr.get_bounds()),
                    "pindex": pindex}

        if status == enums.Status.widow:
            bffr = self.widgets.textinfowidow.get_buffer()
            return {"partner": self.widgets.entrypartnerwidow.get_pindex(),
                    "info": bffr.get_text(*bffr.get_bounds()),
                    "pindex": pindex}

    def _get_pigeonsearch_details(self, sex):
        try:
            pindex = self.widgets.entrybandedit.get_pindex()
        except errors.InvalidInputError:
            ErrorDialog(messages.MSG_NO_PARENT, self.parent)
            return
        band, year = self.widgets.entrybandedit.get_band()
        return pindex, sex, year


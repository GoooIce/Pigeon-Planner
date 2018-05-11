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

"""
A detailed pedigree of the selected pigeon.
"""

import os

import gtk

from pigeonplanner.ui import tools
from pigeonplanner.ui.filechooser import PdfSaver
from pigeonplanner.ui.messagedialog import InfoDialog, ErrorDialog
from pigeonplanner.core import common
from pigeonplanner.core import config
from pigeonplanner.core import pigeonparser
from pigeonplanner.reportlib import (report, ReportError, PRINT_ACTION_DIALOG,
                                     PRINT_ACTION_PREVIEW, PRINT_ACTION_EXPORT)
from pigeonplanner.reports import get_pedigree


(PREVIOUS,
 NEXT_SIRE,
 NEXT_DAM) = range(3)


class PedigreeWindow(gtk.Window):
    ui = """
<ui>
   <toolbar name="Toolbar">
      <toolitem action="Save"/>
      <separator/>
      <toolitem action="Preview"/>
      <toolitem action="Print"/>
      <separator/>
      <toolitem action="Close"/>
   </toolbar>
</ui>
"""
    def __init__(self, parent, pedigree, pigeon):
        gtk.Window.__init__(self)
        self.connect("delete-event", self.on_close_dialog)
        self.set_modal(True)
        self.resize(960, 600)
        self.set_transient_for(parent)
        self.set_position(gtk.WIN_POS_CENTER_ON_PARENT)
        self.set_skip_taskbar_hint(True)

        self.pedigree = pedigree
        self.pigeon = pigeon
        self._current_pigeon = pigeon
        self._previous_pigeons = []
        ring, year = pigeon.get_band()
        self.pdfname = "%s_%s_%s.pdf" % (_("Pedigree"), year, ring)
        self._build_ui()
        pedigree.draw_pedigree(self._get_pedigree_table(), pigeon, True,
                               self.on_pedigree_draw)

        name = pigeon.get_name()
        if name:
            name = ", " + name
        title = "%s: %s%s - %s" % (_("Pedigree"), pigeon.get_band_string(True),
                                   name, pigeon.get_sex_string())
        self.set_title(title)
        self.show_all()

    def _build_ui(self):
        vbox = gtk.VBox(False, 8)

        actiongroup = gtk.ActionGroup("PedigreeWindowActions")
        actiongroup.add_actions((
            ("Save", gtk.STOCK_SAVE, None, None,
                    _("Save this pedigree"), self.on_save_clicked),
            ##("Mail", "email", None, None,
            ##        _("Email this pedigree"), self.on_mail_clicked),
            ("Preview", gtk.STOCK_PRINT_PREVIEW, None, None,
                    _("View this pedigree"), self.on_preview_clicked),
            ("Print", gtk.STOCK_PRINT, None, None,
                    _("Print this pedigree"), self.on_print_clicked),
            ("Close", gtk.STOCK_CLOSE, None, None,
                    _("Close this window"), self.on_close_dialog)
           ))
        uimanager = gtk.UIManager()
        uimanager.add_ui_from_string(self.ui)
        uimanager.insert_action_group(actiongroup, 0)
        accelgroup = uimanager.get_accel_group()
        self.add_accel_group(accelgroup)

        toolbar = uimanager.get_widget("/Toolbar")
        vbox.pack_start(toolbar, False, False)

        self.table = table = gtk.Table(20, 7)

        image = gtk.image_new_from_stock(gtk.STOCK_GO_BACK, gtk.ICON_SIZE_BUTTON)
        self.buttonprev = gtk.Button()
        self.buttonprev.add(image)
        self.buttonprev.set_relief(gtk.RELIEF_NONE)
        self.buttonprev.connect("clicked", self.on_navbutton_clicked, PREVIOUS)
        table.attach(self.buttonprev, 0, 1, 7, 8, 0, 0)
        image = gtk.image_new_from_stock(gtk.STOCK_GO_FORWARD, gtk.ICON_SIZE_BUTTON)
        self.buttonnextsire = gtk.Button()
        self.buttonnextsire.add(image)
        self.buttonnextsire.set_relief(gtk.RELIEF_NONE)
        self.buttonnextsire.connect("clicked", self.on_navbutton_clicked, NEXT_SIRE)
        table.attach(self.buttonnextsire, 8, 9, 3, 4, 0, 0)
        image = gtk.image_new_from_stock(gtk.STOCK_GO_FORWARD, gtk.ICON_SIZE_BUTTON)
        self.buttonnextdam = gtk.Button()
        self.buttonnextdam.add(image)
        self.buttonnextdam.set_relief(gtk.RELIEF_NONE)
        self.buttonnextdam.connect("clicked", self.on_navbutton_clicked, NEXT_DAM)
        table.attach(self.buttonnextdam, 8, 9, 11, 12, 0, 0)

        alignment = gtk.Alignment(.5, .5)
        alignment.set_padding(4, 4, 8, 8)
        alignment.add(table)

        vbox.pack_start(alignment)
        self.add(vbox)

    def _get_pedigree_table(self):
        return self.table

    def on_close_dialog(self, widget, event=None):
        self.destroy()
        self.pedigree.draw_cb = None
        return False

    def on_navbutton_clicked(self, widget, nav):
        if nav == PREVIOUS:
            pigeon = self._previous_pigeons.pop()
        else:
            sire, dam = pigeonparser.parser.get_parents(self._current_pigeon)
            self._previous_pigeons.append(self._current_pigeon)
            pigeon = sire if nav == NEXT_SIRE else dam

        self._current_pigeon = pigeon
        self.pedigree.draw_pedigree(self._get_pedigree_table(), pigeon, True)

    def on_pedigree_draw(self):
        can_prev = self._current_pigeon.pindex != self.pigeon.pindex
        self.buttonprev.set_sensitive(can_prev)

        sire, dam = pigeonparser.parser.get_parents(self._current_pigeon)
        can_next_sire = sire is not None
        self.buttonnextsire.set_sensitive(can_next_sire)
        can_next_dam = dam is not None
        self.buttonnextdam.set_sensitive(can_next_dam)

    def on_mail_clicked(self, widget):
        #TODO: disabled for now. Remove?
        ##self.do_operation(const.MAIL)
        ##pedigree = os.path.join(const.TEMPDIR, self.pdfname)
        ##maildialog.MailDialog(self, pedigree)
        pass

    def on_save_clicked(self, widget):
        chooser = PdfSaver(self, self.pdfname)
        response = chooser.run()
        if response == gtk.RESPONSE_OK:
            save_path = chooser.get_filename()
            self.do_operation(PRINT_ACTION_EXPORT, save_path)
        chooser.destroy()

    def on_preview_clicked(self, widget):
        self.do_operation(PRINT_ACTION_PREVIEW)

    def on_print_clicked(self, widget):
        self.do_operation(PRINT_ACTION_DIALOG)

    def do_operation(self, print_action, save_path=None):
        userinfo = common.get_own_address()
        if not tools.check_user_info(self, userinfo["name"]):
            return

        # Show a message to the user if the original image is not found and
        # can't be shown on the pedigree
        if config.get("printing.pedigree-image") and self.pigeon.image is not None:
            if not os.path.exists(self.pigeon.image):
                msg = (_("Cannot find image '%s'"),
                       _("You need to edit the pigeon and select the correct "
                         "path or restore the original image on your computer."),
                       "")
                # In some very old versions, an empty image was stored as an
                # empty string instead of None. Don't show this message in cases
                # like this ofcourse.
                if not self.pigeon.image == "":
                    InfoDialog(msg, self, self.pigeon.image)

        PedigreeReport, PedigreeReportOptions = get_pedigree()
        psize = common.get_pagesize_from_opts()
        opts = PedigreeReportOptions(psize, print_action=print_action,
                                            filename=save_path, parent=self)
        try:
            report(PedigreeReport, opts, self.pigeon, userinfo)
        except ReportError as exc:
            ErrorDialog((exc.value.split("\n")[0],
                         _("You probably don't have write permissions on this folder."),
                         _("Error"))
                    )


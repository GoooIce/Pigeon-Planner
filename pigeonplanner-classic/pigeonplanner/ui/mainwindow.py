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
Main window class
"""


import os
import os.path
import time
import webbrowser
import logging
logger = logging.getLogger(__name__)

import gtk

from pigeonplanner import messages
from pigeonplanner import database
from pigeonplanner.ui import tabs
from pigeonplanner.ui import tools
from pigeonplanner.ui import utils
from pigeonplanner.ui import builder
from pigeonplanner.ui import dialogs
from pigeonplanner.ui import pedigree
from pigeonplanner.ui import logdialog
from pigeonplanner.ui import component
from pigeonplanner.ui import detailsview
from pigeonplanner.ui import exportwindow
from pigeonplanner.ui import optionsdialog
from pigeonplanner.ui import pedigreewindow
from pigeonplanner.ui.widgets import treeview
from pigeonplanner.ui.messagedialog import ErrorDialog, InfoDialog, QuestionDialog
from pigeonplanner.core import enums
from pigeonplanner.core import const
from pigeonplanner.core import common
from pigeonplanner.core import checks
from pigeonplanner.core import errors
from pigeonplanner.core import update
from pigeonplanner.core import backup
from pigeonplanner.core import config
from pigeonplanner.core import pigeon as corepigeon
from pigeonplanner.core import pigeonparser
from pigeonplanner.reportlib import report
from pigeonplanner.reports import get_pedigree
from pigeonplanner.reports.pigeons import PigeonsReport, PigeonsReportOptions

try:
    from gtkosx_application import Application
except ImportError:
    gtkosx = None
    if const.OSX:
        logger.error("Unable to import gtkosx_application")
else:
    # Need to be called as early as possible
    gtkosx = Application()


class MainWindow(gtk.Window, builder.GtkBuilder, component.Component):
    ui = """
<ui>
   <menubar name="MenuBar">
      <menu action="FileMenu">
         <menuitem action="Add"/>
         <menuitem action="Addrange"/>
         <separator/>
         <menuitem action="Log"/>
         <separator/>
         <menuitem action="Export"/>
         <menu action="PrintMenu">
            <menuitem action="PrintPigeons"/>
            <menuitem action="PrintPedigree"/>
            <menuitem action="PrintBlank"/>
         </menu>
         <separator/>
         <menu action="BackupMenu">
            <menuitem action="Backup"/>
            <menuitem action="Restore"/>
         </menu>
         <separator/>
         <menuitem action="Quit"/>
      </menu>
      <menu action="EditMenu">
         <menuitem action="SelectAll"/>
         <separator/>
         <menuitem action="Preferences"/>
      </menu>
      <menu action="ViewMenu">
         <menuitem action="Filter"/>
         <menuitem action="ShowAll"/>
         <separator/>
         <menuitem action="Arrows"/>
         <menuitem action="Stats"/>
         <menuitem action="Toolbar"/>
         <menuitem action="Statusbar"/>
      </menu>
      <menu action="PigeonMenu">
         <menuitem action="Edit"/>
         <menuitem action="Remove"/>
         <menuitem action="Pedigree"/>
         <menuitem action="Addresult"/>
      </menu>
      <menu action="ToolsMenu">
         <menuitem action="Velocity"/>
         <menuitem action="Distance"/>
         <menuitem action="Racepoints"/>
         <menuitem action="Album"/>
         <menuitem action="Addresses"/>
         <menuitem action="Data"/>
      </menu>
      <menu action="HelpMenu">
         <menuitem action="Help"/>
         <menuitem action="Home"/>
         <menuitem action="Forum"/>
         <separator/>
         <menuitem action="Update"/>
         <separator/>
         <menuitem action="Info"/>
         <separator/>
         <menuitem action="About"/>
      </menu>
   </menubar>

   <toolbar name="Toolbar">
      <toolitem action="Add"/>
      <separator/>
      <toolitem action="Edit"/>
      <toolitem action="Remove"/>
      <toolitem action="Pedigree"/>
      <separator/>
      <toolitem action="Preferences"/>
      <separator/>
      <toolitem action="About"/>
      <toolitem action="Quit"/>
   </toolbar>
</ui>
"""
    def __init__(self):
        gtk.Window.__init__(self)
        builder.GtkBuilder.__init__(self, "MainWindow.ui")
        component.Component.__init__(self, "MainWindow")

        self.widgets.treeview = treeview.MainTreeView()
        self.widgets.treeview.connect("pigeons-changed", self.on_treeview_pigeons_changed)
        self.widgets.treeview.connect("key-press-event", self.on_treeview_key_press)
        self.widgets.treeview.connect("button-press-event", self.on_treeview_press)
        self.widgets.scrolledwindow.add(self.widgets.treeview)
        self.widgets.selection = self.widgets.treeview.get_selection()
        self.widgets.selection.connect("changed", self.on_selection_changed)

        self.pedigree = pedigree.DrawPedigree()
        self.detailsview = detailsview.DetailsView(self, True)
        self.widgets.aligndetails.add(self.detailsview.get_root_widget())

        pedigreetab = tabs.PedigreeTab(self.pedigree)
        relativestab = tabs.RelativesTab()
        self.resultstab = tabs.ResultsTab()
        breedingtab = tabs.BreedingTab()
        mediatab = tabs.MediaTab()
        medicationtab = tabs.MedicationTab()
        self._loaded_tabs = [pedigreetab, relativestab,
                             self.resultstab, breedingtab,
                             mediatab, medicationtab]
        for tab in self._loaded_tabs:
            self.widgets.notebook.append_page(*tab.get_tab_widgets())

        self._build_menubar()
        self.widgets.treeview.fill_treeview()
        self.current_pigeon = 0
        self.pigeon_no = len(self.widgets.treeview.get_model())
        self.widgets.removedialog.set_transient_for(self)
        self.widgets.rangedialog.set_transient_for(self)

        self.widgets.MenuShowAll.set_active(config.get("interface.show-all-pigeons"))
        self.widgets.MenuArrows.set_active(config.get("interface.arrows"))
        self.widgets.MenuStats.set_active(config.get("interface.stats"))
        self.widgets.MenuToolbar.set_active(config.get("interface.toolbar"))
        self.widgets.MenuStatusbar.set_active(config.get("interface.statusbar"))

        self.connect("delete-event", self.quit_program)
        self.set_title(const.NAME)
        self.set_icon_from_file(os.path.join(const.IMAGEDIR, "icon_logo.png"))
        self.add(self.widgets.mainvbox)
        self.resize(config.get("interface.window-w"),
                    config.get("interface.window-h"))
        self.move(config.get("interface.window-x"),
                  config.get("interface.window-y"))
        self.show()
        self.widgets.treeview.grab_focus()

        if gtkosx is not None:
            def osx_quit(*args):
                self.quit_program(bckp=False)
                return False
            gtkosx.connect("NSApplicationBlockTermination", osx_quit)
            gtkosx.ready()

    def quit_program(self, widget=None, event=None, bckp=True):
        try:
            database.session.optimize_database()
        except Exception as exc:
            logger.error("Database optimizing failed: %s", exc)
        database.session.close()

        x, y = self.get_position()
        w, h = self.get_size()
        config.set("interface.window-x", x)
        config.set("interface.window-y", y)
        config.set("interface.window-w", w)
        config.set("interface.window-h", h)

        if config.get("backup.automatic-backup") and bckp:
            daysInSeconds = config.get("backup.interval") * 24 * 60 * 60
            if time.time() - config.get("backup.last") >= daysInSeconds:
                if backup.make_backup(config.get("backup.location")):
                    InfoDialog(messages.MSG_BACKUP_SUCCES, self)
                else:
                    InfoDialog(messages.MSG_BACKUP_FAILED, self)
                config.set("backup.last", time.time())
        config.save()
        gtk.main_quit()

    ####################
    # Callbacks
    ####################
    # Various
    def on_dialog_delete(self, dialog, event):
        dialog.hide()
        return True

    def on_interface_changed(self, dialog, arrows, stats, toolbar, statusbar):
        self.widgets.MenuArrows.set_active(arrows)
        self.widgets.MenuStats.set_active(stats)
        self.widgets.MenuToolbar.set_active(toolbar)
        self.widgets.MenuStatusbar.set_active(statusbar)

        self.resultstab.reset_result_mode()

        self.widgets.treeview.set_columns()
        self.resultstab.set_columns()

    def on_edit_finished(self, detailsview, pigeon, operation):
        if operation == enums.Action.edit:
            model, paths = self.widgets.selection.get_selected_rows()
            path = self.widgets.treeview.get_child_path(paths[0])
            self.widgets.treeview.update_pigeon(pigeon, path=path)
            self.widgets.selection.emit("changed")
        elif operation == enums.Action.add:
            if not pigeon.get_visible(): return
            self.widgets.treeview.add_pigeon(pigeon)
            self.widgets.statusbar.display_message(
                        _("Pigeon %s has been added") % pigeon.get_band_string())
        self.widgets.treeview.grab_focus()

    # Menu callbacks
    def on_uimanager_connect_proxy(self, uimgr, action, widget):
        tooltip = action.get_property("tooltip")
        if isinstance(widget, gtk.MenuItem) and tooltip:
            widget.connect("select", self.on_menuitem_select, tooltip)
            widget.connect("deselect", self.on_menuitem_deselect)

    def on_menuitem_select(self, menuitem, tooltip):
        self.widgets.statusbar.push(-1, tooltip)

    def on_menuitem_deselect(self, menuitem):
        self.widgets.statusbar.pop(-1)

    def menuexport_activate(self, widget):
        exportwindow.ExportWindow(self)

    def menuprintpigeons_activate(self, widget):
        logger.debug(common.get_function_name())

        userinfo = common.get_own_address()

        if not tools.check_user_info(self, userinfo["name"]):
            return

        pigeons = self.widgets.treeview.get_pigeons(True)
        psize = common.get_pagesize_from_opts()
        reportopts = PigeonsReportOptions(psize)
        report(PigeonsReport, reportopts, pigeons, userinfo)

    def menuprintpedigree_activate(self, widget):
        logger.debug(common.get_function_name())
        pigeon = self.widgets.treeview.get_selected_pigeon()
        if pigeon is None or isinstance(pigeon, list): return
        userinfo = common.get_own_address()

        PedigreeReport, PedigreeReportOptions = get_pedigree()
        psize = common.get_pagesize_from_opts()
        opts = PedigreeReportOptions(psize)
        report(PedigreeReport, opts, pigeon, userinfo)

    def menuprintblank_activate(self, widget):
        logger.debug(common.get_function_name())
        userinfo = common.get_own_address()

        PedigreeReport, PedigreeReportOptions = get_pedigree()
        psize = common.get_pagesize_from_opts()
        opts = PedigreeReportOptions(psize)
        report(PedigreeReport, opts, None, userinfo)

    def menubackup_activate(self, widget):
        logger.debug(common.get_function_name())
        dialog = dialogs.BackupDialog(self, enums.Backup.create)
        dialog.run()
        dialog.destroy()

    def menurestore_activate(self, widget):
        logger.debug(common.get_function_name())
        dialog = dialogs.BackupDialog(self, enums.Backup.restore)
        dialog.run()
        dialog.destroy()

    def menuclose_activate(self, widget):
        logger.debug(common.get_function_name())
        self.quit_program()

    def menuselectall_activate(self, widget):
        logger.debug(common.get_function_name())
        self.widgets.treeview.select_all_pigeons()

    def menualbum_activate(self, widget):
        logger.debug(common.get_function_name())
        tools.PhotoAlbum(self)

    def menulog_activate(self, widget):
        logger.debug(common.get_function_name())
        logdialog.LogDialog()

    def menuadd_activate(self, widget):
        dialog = detailsview.DetailsDialog(None, self, enums.Action.add)
        dialog.details.connect("edit-finished", self.on_edit_finished)

    def menuaddrange_activate(self, widget):
        logger.debug(common.get_function_name())
        self.widgets.entryRangeFrom.set_text("")
        self.widgets.entryRangeTo.set_text("")
        self.widgets.entryRangeYear.set_text("")
        self.widgets.combosexrange.set_active(2)
        self.widgets.entryRangeFrom.grab_focus()
        self.widgets.rangedialog.show()

    def menuedit_activate(self, widget):
        model, paths = self.widgets.selection.get_selected_rows()
        if len(paths) != 1: return
        pigeon = self.widgets.treeview.get_selected_pigeon()
        dialog = detailsview.DetailsDialog(pigeon, self, enums.Action.edit)
        dialog.details.connect("edit-finished", self.on_edit_finished)

    def menuremove_activate(self, widget):
        model, paths = self.widgets.selection.get_selected_rows()

        if self.widgets.selection.count_selected_rows() == 0:
            return
        elif self.widgets.selection.count_selected_rows() == 1:
            pigeon = self.widgets.treeview.get_selected_pigeon()
            pigeons = [pigeon]
            pigeonlabel = pigeon.get_band_string()
            statusbarmsg = _("Pigeon %s has been removed") % pigeonlabel
            show_result_option = database.pigeon_has_results(pigeon.get_pindex())
        else:
            pigeons = [pobj for pobj in self.widgets.treeview.get_selected_pigeon()]
            pigeonlabel = ", ".join([pigeon.get_band_string() for pigeon in pigeons])
            statusbarmsg = _("%s pigeons have been removed") % len(pigeons)
            show_result_option = False
            for pigeon in pigeons:
                if database.pigeon_has_results(pigeon.get_pindex()):
                    show_result_option = True
                    break

        self.widgets.labelPigeon.set_text(pigeonlabel)
        self.widgets.chkKeep.set_active(True)
        self.widgets.chkResults.set_active(False)
        self.widgets.chkResults.set_visible(show_result_option)

        answer = self.widgets.removedialog.run()
        if answer == 2:
            if self.widgets.chkKeep.get_active():
                logger.debug("Remove: Hiding the pigeon(s)")
                for pigeon in pigeons:
                    pigeon.show = 0
                    database.update_pigeon(pigeon.get_pindex(), {"show": 0})
            else:
                remove_results = not self.widgets.chkResults.get_active()
                for pigeon in pigeons:
                    corepigeon.remove_pigeon(pigeon, remove_results)

            # Reverse the pathlist so we can safely remove each row without
            # having problems with invalid paths.
            paths.reverse()
            # Block the selection changed handler during deletion. In some cases
            # while removing multiple rows the tree iters would get invalid in
            # the handler. There's no need for it to be called anyway after each
            # call, once at the end is enough.
            self.widgets.selection.handler_block_by_func(self.on_selection_changed)
            for path in paths:
                self.widgets.treeview.remove_row(path)
            self.widgets.selection.handler_unblock_by_func(self.on_selection_changed)
            self.widgets.selection.select_path(paths[-1])
            self.widgets.statusbar.display_message(statusbarmsg)

        self.widgets.removedialog.hide()

    def menupedigree_activate(self, widget):
        logger.debug(common.get_function_name())
        pigeon = self.widgets.treeview.get_selected_pigeon()
        if pigeon is None:
            # Disable pedigree shortcut when no pigeon is selected
            return
        pedigreewindow.PedigreeWindow(self, self.pedigree, pigeon)

    def menuaddresult_activate(self, widget):
        logger.debug(common.get_function_name())
        self.widgets.notebook.set_current_page(2)
        self.resultstab.add_new_result()

    def menufilter_activate(self, widget):
        logger.debug(common.get_function_name())
        self.widgets.treeview.run_filterdialog(self)

    def menushowall_toggled(self, widget):
        config.set("interface.show-all-pigeons", widget.get_active())
        self.widgets.treeview.fill_treeview()

    def menupref_activate(self, widget):
        logger.debug(common.get_function_name())
        dialog = optionsdialog.OptionsDialog(self)
        dialog.connect("interface-changed", self.on_interface_changed)

    def menuarrows_toggled(self, widget):
        value = widget.get_active()
        utils.set_multiple_visible([self.widgets.vboxButtons], value)
        config.set("interface.arrows", value)

    def menustats_toggled(self, widget):
        value = widget.get_active()
        utils.set_multiple_visible([self.widgets.alignStats], value)
        config.set("interface.stats", value)

    def menutoolbar_toggled(self, widget):
        value = widget.get_active()
        utils.set_multiple_visible([self.widgets.toolbar], value)
        config.set("interface.toolbar", value)

    def menustatusbar_toggled(self, widget):
        value = widget.get_active()
        utils.set_multiple_visible([self.widgets.statusbar], value)
        config.set("interface.statusbar", value)

    def menuvelocity_activate(self, widget):
        logger.debug(common.get_function_name())
        tools.VelocityCalculator(self)

    def menudistance_activate(self, widget):
        logger.debug(common.get_function_name())
        tools.DistanceCalculator(self)

    def menurace_activate(self, widget):
        logger.debug(common.get_function_name())
        tools.RacepointManager(self)

    def menuaddresses_activate(self, widget):
        logger.debug(common.get_function_name())
        tools.AddressBook(self)

    def menudata_activate(self, widget):
        logger.info(common.get_function_name())
        tools.DataManager(self)

    def menuhelp_activate(self, widget):
        logger.debug(common.get_function_name())
        webbrowser.open(const.DOCURLMAIN)

    def menuhome_activate(self, widget):
        logger.debug(common.get_function_name())
        webbrowser.open(const.WEBSITE)

    def menuforum_activate(self, widget):
        logger.debug(common.get_function_name())
        webbrowser.open(const.FORUMURL)

    def menuupdate_activate(self, widget):
        logger.debug(common.get_function_name())
        try:
            new, msg = update.update()
        except update.UpdateError as exc:
            new = False
            msg = str(exc)

        title = _("Search for updates...")
        if new:
            if QuestionDialog((msg, _("Go to the website?"), title), self).run():
                webbrowser.open(const.DOWNLOADURL)
        else:
            InfoDialog((msg, None, title), self)

    def menuinfo_activate(self, widget):
        logger.debug(common.get_function_name())
        dialogs.InformationDialog(self)

    def menuabout_activate(self, widget):
        logger.debug(common.get_function_name())
        dialogs.AboutDialog(self)

    # range callbacks
    def on_rangeadd_clicked(self, widget):
        rangefrom = self.widgets.entryRangeFrom.get_text()
        rangeto = self.widgets.entryRangeTo.get_text()
        rangeyear = self.widgets.entryRangeYear.get_text()
        rangesex = self.widgets.combosexrange.get_sex()

        try:
            checks.check_ring_entry(rangefrom, rangeyear)
            checks.check_ring_entry(rangeto, rangeyear)
        except errors.InvalidInputError as msg:
            ErrorDialog(msg.value, self)
            return
        if not rangefrom.isdigit() or not rangeto.isdigit():
            ErrorDialog(messages.MSG_INVALID_RANGE, self)
            return

        logger.debug("Adding a range of pigeons")
        value = int(rangefrom)
        while value <= int(rangeto):
            band = str(value)
            pindex = common.get_pindex_from_band(band, rangeyear)
            logger.debug("Range: adding '%s'", pindex)
            if database.pigeon_exists(pindex):
                value += 1
                continue
            pigeon = pigeonparser.parser.add_empty_pigeon(pindex, rangesex)
            self.widgets.treeview.add_pigeon(pigeon)
            value += 1

        self.widgets.rangedialog.hide()

    def on_rangecancel_clicked(self, widget):
        self.widgets.rangedialog.hide()

    # Main treeview callbacks
    def on_treeview_pigeons_changed(self, treeview):
        pigeons = self.widgets.treeview.get_pigeons(filtered=True)
        total = len(pigeons)
        cocks = 0
        hens = 0
        ybirds = 0
        for pigeon in pigeons:
            if pigeon.sex == enums.Sex.cock:
                cocks += 1
            elif pigeon.sex == enums.Sex.hen:
                hens += 1
            elif pigeon.sex == enums.Sex.unknown:
                ybirds += 1

        self.widgets.labelStatTotal.set_markup("<b>%i</b>" %total)
        self.widgets.labelStatCocks.set_markup("<b>%i</b>" %cocks)
        self.widgets.labelStatHens.set_markup("<b>%i</b>" %hens)
        self.widgets.labelStatYoung.set_markup("<b>%i</b>" %ybirds)
        self.widgets.statusbar.set_total(total)

    def on_treeview_press(self, treeview, event):
        pthinfo = treeview.get_path_at_pos(int(event.x), int(event.y))
        if pthinfo is None: return

        if event.button == 3:
            entries = [
                (gtk.STOCK_EDIT, self.menuedit_activate, None, None),
                (gtk.STOCK_REMOVE, self.menuremove_activate, None, None),
                ("pedigree-detail", self.menupedigree_activate, None, None)]
            utils.popup_menu(event, entries)

    def on_treeview_key_press(self, treeview, event):
        keyname = gtk.gdk.keyval_name(event.keyval)
        if keyname == "Delete":
            self.menuremove_activate(None)
        elif keyname == "Insert":
            self.menuadd_activate(None)

    def on_selection_changed(self, selection):
        n_rows_selected = selection.count_selected_rows()
        model, paths = selection.get_selected_rows()
        widgets = [self.widgets.ToolRemove, self.widgets.MenuRemove,
                   self.widgets.ToolEdit, self.widgets.ToolPedigree,
                   self.widgets.MenuEdit,
                   self.widgets.MenuPedigree, self.widgets.MenuAddresult]
        for tab in self._loaded_tabs:
            widgets.extend(tab.get_pigeon_state_widgets())

        if n_rows_selected == 1:
            tree_iter = model.get_iter(paths[0])
            utils.set_multiple_sensitive(widgets, True)
        elif n_rows_selected == 0:
            self._clear_pigeon_data()
            utils.set_multiple_sensitive(widgets, False)
            return
        elif n_rows_selected > 1:
            # Disable everything except the remove buttons
            self._clear_pigeon_data()
            utils.set_multiple_sensitive(widgets[2:], False)
            return
        self.current_pigeon = paths[0][0]
        pigeon = model.get_value(tree_iter, 0)
        self.detailsview.set_details(pigeon)
        for tab in self._loaded_tabs:
            tab.set_pigeon(pigeon)

    # Navigation arrows callbacks
    def on_button_top_clicked(self, widget):
        self._set_pigeon(0)

    def on_button_up_clicked(self, widget):
        self._set_pigeon(self.current_pigeon - 1)

    def on_button_down_clicked(self, widget):
        self._set_pigeon(self.current_pigeon + 1)

    def on_button_bottom_clicked(self, widget):
        self._set_pigeon(self.pigeon_no - 1)

    ####################
    # Public methods
    ####################

    ####################
    # Internal methods
    ####################
    def _build_menubar(self):
        uimanager = gtk.UIManager()
        uimanager.add_ui_from_string(self.ui)
        uimanager.insert_action_group(self.widgets.actiongroup, 0)
        accelgroup = uimanager.get_accel_group()
        self.add_accel_group(accelgroup)

        widgetDic = {
            "menubar": uimanager.get_widget("/MenuBar"),
            "toolbar": uimanager.get_widget("/Toolbar"),
            "MenuShowAll": uimanager.get_widget("/MenuBar/ViewMenu/ShowAll"),
            "MenuArrows": uimanager.get_widget("/MenuBar/ViewMenu/Arrows"),
            "MenuStats": uimanager.get_widget("/MenuBar/ViewMenu/Stats"),
            "MenuToolbar": uimanager.get_widget("/MenuBar/ViewMenu/Toolbar"),
            "MenuStatusbar": \
                uimanager.get_widget("/MenuBar/ViewMenu/Statusbar"),
            "Filtermenu": uimanager.get_widget("/MenuBar/ViewMenu/FilterMenu"),
            "MenuEdit": uimanager.get_widget("/MenuBar/PigeonMenu/Edit"),
            "MenuRemove": uimanager.get_widget("/MenuBar/PigeonMenu/Remove"),
            "MenuPedigree": \
                uimanager.get_widget("/MenuBar/PigeonMenu/Pedigree"),
            "MenuAddresult": \
                uimanager.get_widget("/MenuBar/PigeonMenu/Addresult"),
            "ToolEdit": uimanager.get_widget("/Toolbar/Edit"),
            "ToolRemove": uimanager.get_widget("/Toolbar/Remove"),
            "ToolPedigree": uimanager.get_widget("/Toolbar/Pedigree")
            }
        for name, widget in widgetDic.items():
            setattr(self.widgets, name, widget)

        utils.set_multiple_sensitive([
                            self.widgets.MenuEdit, self.widgets.MenuRemove,
                            self.widgets.MenuPedigree, self.widgets.MenuAddresult,
                            self.widgets.ToolEdit, self.widgets.ToolRemove,
                            self.widgets.ToolPedigree], False)

        self.widgets.mainvbox.pack_start(self.widgets.menubar, False, False)
        self.widgets.mainvbox.pack_start(self.widgets.toolbar, False, False)

        if gtkosx is not None:
            logger.debug("Setting up Mac menubar")
            self.widgets.menubar.hide()
            gtkosx.set_menu_bar(self.widgets.menubar)

            quit = uimanager.get_widget("/MenuBar/FileMenu/Quit")
            quit.hide()

            about = uimanager.get_widget("/MenuBar/HelpMenu/About")
            upd = uimanager.get_widget("/MenuBar/HelpMenu/Update")
            prefs = uimanager.get_widget("/MenuBar/EditMenu/Preferences")
            gtkosx.insert_app_menu_item(about, 0)
            gtkosx.insert_app_menu_item(gtk.SeparatorMenuItem(), 1)
            gtkosx.insert_app_menu_item(upd, 2)
            gtkosx.insert_app_menu_item(prefs, 3)

    def _clear_pigeon_data(self):
        self.detailsview.clear_details()
        for tab in self._loaded_tabs:
            tab.clear_pigeon()

    def _set_pigeon(self, pigeon_no):
        if pigeon_no < 0 or pigeon_no >= self.pigeon_no:
            return

        if self.current_pigeon != pigeon_no:
            self.widgets.selection.unselect_all()
            self.widgets.selection.select_path(pigeon_no)
            self.widgets.treeview.scroll_to_cell(pigeon_no)


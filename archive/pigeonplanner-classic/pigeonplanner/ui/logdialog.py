# -*- coding: utf-8 -*-

# This file is part of Pigeon Planner.
# Parts taken and inspired by Tucan.

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
Logdialog class
"""


import os.path

import gtk
import gobject

from pigeonplanner.core import const


SEVERITY = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL", "TRACEBACK"]
COLORS = {"DEBUG": "grey", "INFO": "green", "WARNING": "yellow",
          "ERROR": "red", "CRITICAL": "white", "TRACEBACK": "white"}

class LogDialog(gtk.Dialog):
    def __init__(self,):
        gtk.Dialog.__init__(self)
        self.set_title(_("Logfile Viewer"))
        self.set_size_request(700,500)
        self.set_icon(self.render_icon(gtk.STOCK_FILE, gtk.ICON_SIZE_MENU))

        self.set_logfile()

        frame = gtk.Frame()
        self.vbox.pack_start(frame)
        frame.set_border_width(10)
        hbox = gtk.HBox()
        frame.add(hbox)

        #auto scroll 
        scroll = gtk.ScrolledWindow()
        hbox.pack_start(scroll)
        scroll.set_policy(gtk.POLICY_AUTOMATIC, gtk.POLICY_AUTOMATIC)
        scroll.get_vadjustment().connect("changed", self.changed)
        scroll.get_vadjustment().connect("value-changed", self.value_changed)

        #textview
        bffr = gtk.TextBuffer()
        self.textview = gtk.TextView(bffr)
        scroll.add(self.textview)
        self.textview.set_wrap_mode(gtk.WRAP_NONE)
        self.textview.set_editable(False)
        self.textview.set_cursor_visible(False)
        self.textview.modify_base(gtk.STATE_NORMAL,
                                  gtk.gdk.color_parse("black"))

        table = bffr.get_tag_table()
        for name, color in COLORS.items():
            tag = gtk.TextTag(name)
            tag.set_property("foreground", color)
            tag.set_property("left_margin", 10)
            tag.set_property("right_margin", 10)
            table.add(tag)

        #combo
        vbox = gtk.VBox(False, 4)
        align = gtk.Alignment(.0, .0, .0, .0)
        align.add(vbox)
        self.vbox.pack_start(align, False, False, 0)
        label = gtk.Label("Minimum severity shown:")
        label.set_alignment(0, .5)
        vbox.pack_start(label, False, False, 0)

        ##severity
        self.combo = gtk.combo_box_new_text()
        vbox.pack_start(self.combo, False, False, 0)
        self.combo.connect("changed", self.reload_view)

        for s in SEVERITY:
            self.combo.append_text(s)
        self.combo.set_active(0)

        ##logs
        self.combo_logs = gtk.combo_box_new_text()
        vbox.pack_start(self.combo_logs, False, False, 0)
        self.combo_logs.connect("changed", self.set_logfile)
        self.combo_logs.connect("changed", self.reload_view)

        logs = [const.LOGFILE]
        if os.path.exists("%s.old" % const.LOGFILE):
            logs.append("%s.old" % const.LOGFILE)
        for log in logs:
            self.combo_logs.append_text(os.path.basename(log))
        self.combo_logs.set_active(0)

        #action area
        button_close = gtk.Button(None, gtk.STOCK_CLOSE)
        button_close.connect("clicked", self.close)
        self.action_area.pack_start(button_close)

        self.connect("response", self.close)
        self.show_all()

        gobject.timeout_add(1000, self.update)
        self.run()

    def set_logfile(self, widget=None):
        if widget is not None:
            logfile = os.path.join(const.PREFDIR, widget.get_active_text())
        else:
            logfile = const.LOGFILE
        self.file = open(logfile, "r")
        self.back_buffer = gtk.TextBuffer()
        self.back_buffer.set_text(self.file.read())

    def insert_color(self, bffr, line):
        for s in SEVERITY[self.combo.get_active():]:
            if s in line:
                bffr.insert_with_tags(bffr.get_end_iter(), "%s\n" %line,
                                      bffr.get_tag_table().lookup(s))
                break

    def reload_view(self, textview):
        bffr = self.textview.get_buffer()
        bffr.set_text("")
        start, end = self.back_buffer.get_bounds()
        for line in self.back_buffer.get_text(start, end).split("\n"):
            self.insert_color(bffr, line)

    def update(self):
        try:
            bffr = self.textview.get_buffer()
            for line in self.file.readlines():
                self.back_buffer.insert(self.back_buffer.get_end_iter(), line)
                self.insert_color(bffr, line.strip())
        except:
            pass
        else:
            return True

    def changed(self, vadjust):
        if not hasattr(vadjust, "need_scroll") or vadjust.need_scroll:
            vadjust.set_value(vadjust.upper-vadjust.page_size)
            vadjust.need_scroll = True

    def value_changed (self, vadjust):
        vadjust.need_scroll = abs(vadjust.value + vadjust.page_size -
                                  vadjust.upper) < vadjust.step_increment

    def close(self, widget=None, other=None):
        self.file.close()
        self.destroy()


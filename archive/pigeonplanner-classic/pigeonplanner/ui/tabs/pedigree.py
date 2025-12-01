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


import gtk

from pigeonplanner.ui import WidgetFactory
from pigeonplanner.ui.tabs import basetab


class PedigreeTab(WidgetFactory, basetab.BaseTab):
    def __init__(self, pedigree):
        WidgetFactory.__init__(self)
        basetab.BaseTab.__init__(self, "PedigreeTab", _("Pedigree"), "icon_pedigree.png")
        self.pedigree = pedigree

        tablesire = gtk.Table(7, 5)
        alignsire = gtk.Alignment(.5, .5, 1, 1)
        alignsire.set_padding(4, 4, 4, 4)
        alignsire.add(tablesire)
        framesire = gtk.Frame(_("<b>Pedigree sire</b>"))
        framesire.get_label_widget().set_use_markup(True)
        framesire.set_shadow_type(gtk.SHADOW_IN)
        framesire.add(alignsire)
        alignsiretop = gtk.Alignment(.5, .5, 0, 0)
        alignsiretop.set_padding(2, 2, 2, 2)
        alignsiretop.add(framesire)

        tabledam = gtk.Table(7, 5)
        aligndam = gtk.Alignment(.5, .5, 1, 1)
        aligndam.set_padding(4, 4, 4, 4)
        aligndam.add(tabledam)
        framedam = gtk.Frame(_("<b>Pedigree dam</b>"))
        framedam.get_label_widget().set_use_markup(True)
        framedam.set_shadow_type(gtk.SHADOW_IN)
        framedam.add(aligndam)
        aligndamtop = gtk.Alignment(.5, .5, 0, 0)
        aligndamtop.set_padding(2, 2, 2, 2)
        aligndamtop.add(framedam)

        self.widgets._root = gtk.HBox()
        self.widgets._root.pack_start(alignsiretop, True, True, 0)
        self.widgets._root.pack_start(aligndamtop, True, True, 0)
        self.widgets._root.show_all()

        self._tables = [tablesire, tabledam]
        # Start immediately with an empty pedigree
        self.clear_pigeon()

    # Public methods
    def set_pigeon(self, pigeon=None):
        self.pedigree.draw_pedigree(self._tables, pigeon)

    def clear_pigeon(self):
        self.set_pigeon()


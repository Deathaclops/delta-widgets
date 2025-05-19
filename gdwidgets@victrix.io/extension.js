// Description: This extension adds a digital clock and date to the bottom of the Dash to Dock panel.

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
const { Gio, GLib, Gtk, Meta, St, Clutter } = imports.gi;

function locate_dock() {
    const items = Main.layoutManager.uiGroup.get_children();
    for (const item of items) { if (item.name === "dashtodockContainer") { return item; } }
    return null;
} // end fn locate_dock()

function add_widgets() {

	if (label_time != null) { label_time.destroy(); }
	if (label_date != null) { label_date.destroy(); }

	let dock = locate_dock();
			
	// Calculate width and height
	let allocation = dock.get_allocation_box();
	let width = allocation.get_width();
	let height = allocation.get_height();
	let icon_size = dock.dash.iconSize;
	let widget_height = width;
	let padding = 10;
	let icon_size_padded = icon_size - padding * 2;

	function icon_placement(count) {
		return height - width * count + padding;
	} // end fn icon_placement

	label_time = new St.Label({
		style_class: 'time-label',
		reactive: true,
		can_focus: true,
		track_hover: true,
		text: "...",
	});

	label_time.set_size(width, widget_height);
	label_time.set_position(0, icon_placement(2));
	dock.add_child(label_time);
	
	label_date = new St.Label({
		style_class: 'date-label',
		reactive: true,
		can_focus: true,
		track_hover: true,
		text: "...",
	});

	label_date.set_size(width, widget_height);
	label_date.set_position(0, icon_placement(3));
	dock.add_child(label_date);

	label_time.connect('destroy', () => {
		label_time = null;
	});
	
	label_date.connect('destroy', () => {
		label_date = null;
	});

}

export default class DeltaWidgetsExtension extends Extension {
	enable() {

		globalThis.label_time = null;
		globalThis.label_date = null;
		globalThis.exit = false;
		let complete = false;

		GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {

			complete = (label_time != null) && (label_date != null);

			if (complete == true) {
				let date = new Date();
				let hours = date.getHours();
				let minutes = date.getMinutes();
				let seconds = date.getSeconds();
				let ampm = hours >= 12 ? "PM" : "AM";
				hours = hours % 12;
				hours = hours ? hours : 12;
				hours = hours < 10 ? "0" + hours : hours;
				minutes = minutes < 10 ? "0" + minutes : minutes;
				seconds = seconds < 10 ? "0" + seconds : seconds;
				let month = date.toLocaleString('default', { month: 'short' });
				let day = date.getDate();
				let year = date.getFullYear();
				let day_of_week = date.toLocaleString('default', { weekday: 'long' });
				label_time.set_text(`${hours}:${minutes}\n${seconds}:${ampm}\n`);
				label_date.set_text(`${month} / ${day}\n${year}\n${day_of_week}`);
				return !exit;
			} else {
				add_widgets();
			} return !exit;
		});


	}

	disable() {
		exit = true;
		if (label_time != null) { label_time.destroy(); }
		if (label_date != null) { label_date.destroy(); }
		label_time = null;
		label_date = null;
	}
}

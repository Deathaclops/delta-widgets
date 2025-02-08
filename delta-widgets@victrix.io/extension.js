// Description: This extension adds a digital clock and date to the bottom of the Dash to Dock panel.

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
const { Gio, GLib, Gtk, Meta, St, Clutter } = imports.gi;

let label_1;
let button_2;

function locate_dock() {
    const items = Main.layoutManager.uiGroup.get_children();
    for (const item of items) { if (item.name === "dashtodockContainer") { return item; } }
    return null;
}

function decycle(obj, stack = []) {
    if (!obj || typeof obj !== 'object')
        return obj;
    
    if (stack.includes(obj))
        return null;

    let s = stack.concat([obj]);

    return Array.isArray(obj)
        ? obj.map(x => decycle(x, s))
        : Object.fromEntries(
            Object.entries(obj)
                .map(([k, v]) => [k, decycle(v, s)]));
}

function add_widgets() {
	let dock = locate_dock();
			
	// Calculate width and height
	let allocation = dock.get_allocation_box();
	let width = allocation.get_width();
	let height = allocation.get_height();
	let icon_size = dock.dash.iconSize;
	let widget_height = width;
	let padding = 10;
	let icon_size_padded = icon_size - padding * 2;
	let icon_placement_1 = height - width * 2 + padding;
	let icon_placement_2 = height - width * 3 + padding;

	label_1 = new St.Label({
		style_class: 'time-label',
		reactive: true,
		can_focus: true,
		track_hover: true,
		text: "...",
	});

	label_1.set_size(width, widget_height);
	label_1.set_position(0, icon_placement_1);
	dock.add_child(label_1);
	
	label_2 = new St.Label({
		style_class: 'date-label',
		reactive: true,
		can_focus: true,
		track_hover: true,
		text: "...",
	});

	label_2.set_size(width, widget_height);
	label_2.set_position(0, icon_placement_2);
	dock.add_child(label_2);

	label_1.connect('destroy', () => {
		label_1 = null;
	});
	
	label_2.connect('destroy', () => {
		label_2 = null;
	});

}

export default class DeltaWidgetsExtension extends Extension {
	enable() {

		globalThis.label_1 = null;
		globalThis.label_2 = null;

		GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
			if (label_1 !== null && label_2 !== null) {
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
				label_1.set_text(`${hours}:${minutes}\n${seconds}:${ampm}\n`);
				label_2.set_text(`${month} / ${day}\n${year}\n${day_of_week}`);
				return true;
			} else { add_widgets(); }
			return true;
		});


	}

	disable() {
		if (label_1 !== null) { label_1.destroy(); }
		if (label_2 !== null) { label_2.destroy(); }
		label_1 = null;
		label_2 = null;
	}
}

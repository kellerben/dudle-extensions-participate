/****************************************************************************
 * Copyright 2009,2010,2011 Benjamin Kellermann                             *
 *                                                                          *
 * This file is part of dudle.                                              *
 *                                                                          *
 * Dudle is free software: you can redistribute it and/or modify it under   *
 * the terms of the GNU Affero General Public License as published by       *
 * the Free Software Foundation, either version 3 of the License, or        *
 * (at your option) any later version.                                      *
 *                                                                          *
 * Dudle is distributed in the hope that it will be useful, but WITHOUT ANY *
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or        *
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     *
 * License for more details.                                                *
 *                                                                          *
 * You should have received a copy of the GNU Affero General Public License *
 * along with dudle.  If not, see <http://www.gnu.org/licenses/>.           *
 ***************************************************************************/

"use strict";
/*global Gettext */

if (typeof(Poll) === "undefined") {
	var Poll = {};
} else {
	alert("Somebody captured the Namespace 'Poll'!!!");	
}
Poll.Strings = {};

var gt = new Gettext({ 'domain' : 'dudle' });
function _(msgid) { 
	return gt.gettext(msgid); 
}
function printf(msg, replaceary) {
	return Gettext.strargs(msg, replaceary); 
}
function escapeHtml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**********************************************************
 * remove non-standard characters to give a valid html id *
 * thanks to 
 * http://stackoverflow.com/users/18771/tomalak
 * and
 * http://stackoverflow.com/users/160173/david-murdoch
 **********************************************************/
var gfHtmlID = (function () {
	var cache = {},
	    ncache = {},
	    reg = /[^A-Za-z0-9_\-]/g;
	return function (s) {
		var id;
		if (s in cache) {
			id = cache[s];
		} else {
			id = s.replace(reg, "_");
			if (id in ncache) {
				id += ncache[id]++;
			}
			ncache[id] = 0;
			cache[s] = id;
		}
		return id;
	};
}());


/* returns firefox, ie, opera, safari, chrome, unknown */
function gfBrowserName() {
	var agent, i, browsers;
	agent = navigator.userAgent.toLowerCase();
	browsers =  ["chrome", "epiphany", "opera", "safari", "firefox", "ie"];
	for	(i = 0; i < browsers.length; i++) {
		if (agent.indexOf(browsers[i]) > -1) {
			return browsers[i];
		}
	}
	return "unknown";
}

function cloneObject(source) {
	for (var i in source) {
		if (typeof source[i] === 'source') {
			this[i] = new cloneObject(source[i]);
		} else {
			this[i] = source[i];
		}
	}
}

Poll.store = function (extID, key, value) {
	var successfunc, params = arguments[3] || {};
	params.pollID = Poll.ID;
	params.extID = extID;
	params.service = "store";
	params.key = key;
	params.value = value;

	if (params.success) {
		successfunc = params.success;
		delete params.success;
	}
	$.ajax({
		url: Poll.extDir + "/webservices.cgi",
		data: params,
		method: "post",
		success: successfunc
	});
};

Poll.load = function (extID, key) {
	var successfunc, params = arguments[2] || {};
	params.pollID = Poll.ID;
	params.extID = extID;
	params.service = "load";
	params.key = key;

	if (params.success) {
		successfunc = params.success;
		delete params.success;
	}
	$.ajax({
		url: Poll.extDir + "/webservices.cgi",
		data: params,
		method: "get",
		success: successfunc
	});
};

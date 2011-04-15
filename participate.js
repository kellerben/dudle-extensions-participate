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

Poll.addRow = function(name, columns) {
	var tr = "<tr class='participantrow'><td></td>";
	tr += "<td class='name'>" + name + "</td>"
	$.each(Poll.columns, function(i){
		tr += columns[Poll.columns[i]];
	});
	tr += "</tr>";
	$("#separator_top").before(tr);
};

Poll.modifySum = function(columns) {
	$.each(Poll.columns, function(i){
		var col = Poll.columns[i];
		var colElem = $("#sum_" + col);
		var newSum = parseInt(colElem.text()) + columns[col];
		colElem.text(newSum);
		
		var percentage = newSum*100 / $(".participantrow").size();
		colElem[0].setAttribute("title", Math.round(percentage).toString()+" %");
		colElem[0].setAttribute("class", "sum match_" + (Math.round(percentage/10)*10).toString());
	});

};

Poll.parseNaddRow = function(name, columns) {
	var cHtml = {}, cSum = {};
	$.each(Poll.columns, function(i){
		var col = Poll.columns[i];
		var avail = columns[col];
		cHtml[col] = "<td class='" + Poll.Strings[avail + "val"] + "' title='" + name + ": " + col + "'>" + Poll.Strings[avail] +"</td>";
		cSum[col] = avail == "yes" ? 1 : 0;
	});
	Poll.addRow(name,cHtml);
	Poll.modifySum(cSum);
}




$.ajax({
	url: Poll.extDir + "/webservices.cgi",
	data: {service: 'getColumns', pollID: Poll.ID},
	method:"get",
	success:function(response){
		Poll.columns = JSON.parse(response);


		// test
		Poll.addRow("foobar",{
			"2011-04-25": "<td>a</td>",
			"2011-04-26": "<td>b</td>",
			"2011-04-28": "<td>d</td>",
			"2011-04-27": "<td>c</td>",
		});

		Poll.parseNaddRow("foo",{
			"2011-04-25": "yes",
			"2011-04-26": "yes",
			"2011-04-27": "no",
			"2011-04-28": "maybe"
		});
		Poll.parseNaddRow("foo",{
			"2011-04-25": "yes",
			"2011-04-26": "yes",
			"2011-04-27": "no",
			"2011-04-28": "maybe"
		});
		Poll.parseNaddRow("foo",{
			"2011-04-25": "yes",
			"2011-04-26": "yes",
			"2011-04-27": "no",
			"2011-04-28": "maybe"
		});
	}
});


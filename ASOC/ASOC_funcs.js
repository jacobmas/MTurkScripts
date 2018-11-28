var ASOC={};
ASOC.is_bad_fb_address=function(add_text) {
    // var add_text=
    //           console.log("address.length="+address.length+", address="+add_text);

    add_text=add_text.replace(/,[^,]*County,/i,",").replace(/Suite [A-Z\-\d]+/i,"")
	.replace(/P(\.|\s)?O(\.|\s)? Box [\d\-]+,/i,"123 Fake Street,")
    console.log("address="+add_text);
    var parsedAdd=parseAddress.parseLocation(add_text);
    if(parsedAdd.sec_unit_type!==undefined) parsedAdd.city=parsedAdd.sec_unit_type+" "+parsedAdd.city;
    console.log("parsedAdd="+JSON.stringify(parsedAdd));

    if(parsedAdd.state===undefined)
    {
	var state_regex=/([^\n,]+), ([^\n,]+) ([\d]{5})$/;
	var my_match=add_text.trim().match(state_regex);
	if(my_match && (state_map[my_match[2]]!==undefined || reverse_state_map[my_match[2]]!==undefined))
	{
	    parsedAdd.state=my_match[2];
	}
    }
    if(parsedAdd.state!==undefined && parsedAdd.state!==my_query.state && state_map[parsedAdd.state]!==my_query.state)
    {
	console.log("Bad address parsed="+parsedAdd.state+", my_query="+my_query.state);

	return true;
    }
    if(parsedAdd.city!==undefined)        parsedAdd.city=parsedAdd.city.toLowerCase();

    var query_city=my_query.city.toLowerCase();
    if(parsedAdd.city!==undefined)
    {
	parsedAdd.city=parsedAdd.city.replace(/Township|Twp\.?/i,"").replace(/\'/ig,"").trim();
	parsedAdd.city=parsedAdd.city.replace(/(^|\s)St\.?(^|\s|,)/i,"$1saint$2");
    }
    if(!/County/i.test(my_query.agency_name) && parsedAdd.city!==undefined && parsedAdd.city!==query_city.replace(/\'/g,"")
       && parsedAdd.city.replace(/mount\s/i,"mt ").replace(/Saint\s/i,"st ")!==query_city.replace(/\'/g,"")
       && parsedAdd.city!==my_query.short_name.toLowerCase() && parsedAdd.city.replace(/mount\s/i,"mt ").replace(/saint\s/i,"st ")!==
       my_query.short_name.toLowerCase()
      )
    {
	console.log("Bad address city parsed="+parsedAdd.city+", my_query="+my_query.city);
	return true;
    }
    return false;
};	

function MTurkScript(return_seconds)
{
    this.return_seconds=return_seconds;
    this.removeDiacritics=function(str) {
	return str.replace(/[^\u0000-\u007E]/g, function(a){
            return diacriticsMap[a] || a;
        });
    }
    this.DeCryptString = function(s)
    {
	var n = 0,r = "mailto:",z = 0;
	for( var i = 0; i < s.length/2; i++)
	{
	    z = s.substr(i*2, 1);
	    n = s.charCodeAt( i*2+1 );
	    if( n >= 8364 )
	    {
		n = 128;
	    }
	    r += String.fromCharCode( n - z );
	}
	return r;
    }
    /* DecryptX decrypts certain types of email */
    this.DeCryptX=function(s)
    {
	return DeCryptString( s );
    }
    /* cfDecodeEmail decodes Cloudflare encoded emails */
    this.cfDecodeEmail=function(encodedString) {
	var email = "", r = parseInt(encodedString.substr(0, 2), 16), n, i;
	for (n = 2; encodedString.length - n; n += 2){
	    i = parseInt(encodedString.substr(n, 2), 16) ^ r;
	    email += String.fromCharCode(i);
	}
	return email;
    }
    /* Some basic checks for improper emails beyond email_re */
    this.is_bad_email = function(to_check)
    {
	if(to_check.indexOf("@2x.png")!==-1 || to_check.indexOf("@2x.jpg")!==-1) return true;
	else if(to_check.indexOf("s3.amazonaws.com")!==-1) return true;
	return false;
    }
    /**
     * the_url the url to check for "being good"
     * bad_urls a list of strings which are invalid for a "good url"
     * max_depth the maximum number of split positions when splitting by "/", will always be 3+ for a
     *         valid url
     * max_dashes the maximum number of dashes in the http://www.website.com/[number of dashes here]/
     * to identify a bad aggreggating type url
     */
    this.is_bad_url=function(the_url, bad_urls, max_depth, max_dashes)
    {
	var i,dash_split,do_dashes;
	the_url=the_url.replace(/\/$/,"");
	if(max_depth===undefined) max_depth=4;
	if(max_dashes===undefined || max_dashes===-1) do_dashes=false;
	else do_dashes=true;

	for(i=0; i < bad_urls.length; i++)
	{
	    if(the_url.indexOf(bad_urls[i])!==-1) return true;
	}
	// -1 means we just check for specific bad stuff, not length
	if(max_depth!==-1 && the_url.split("/").length>max_depth) return true;
	if(the_url.split("/").length >= 4 && do_dashes &&
	   the_url.split("/")[3].split("-").length>max_dashes) return true;
	return false;
    }

    /* Can be improved greatly, need a good way to parse addresses globally */
    this.my_parse_address=function(to_parse)
    {
	var ret_add={};
	var state_re=/([A-Za-z]+) ([\d\-]+)$/;
	var canada_zip=/ ([A-Z]{2}) ([A-Z][\d][A-Z] [\d][A-Z][\d])$/;
	to_parse=to_parse.replace(canada_zip,", $&");

	console.log("to_parse="+to_parse);
	var my_match;
	var splits=to_parse.split(",");
	if(splits.length===3)
	{
	    if(canada_zip.test(splits[2]))
	    {
		my_match=splits[2].match(canada_zip);
		ret_add.state=my_match[1];
		ret_add.zip=my_match[2];
	    }
	    else
	    {
		my_match=splits[2].match(state_re);
		if(my_match!==null && my_match!==undefined)
		{
		    ret_add.state=my_match[1];
		    ret_add.zip=my_match[2];
		}
	    }
	    ret_add.street=splits[0].trim();
	    ret_add.city=splits[1].trim();
	}
	else if(splits.length==2)
	{

	    if(canada_zip.test(splits[1]))
	    {
		my_match=splits[1].match(canada_zip);
		ret_add.state=my_match[1];
		ret_add.zip=my_match[2];
	    }
	    else
	    {
		my_match=splits[1].match(state_re);
		if(my_match!==null && my_match!==undefined)
		{
		    ret_add.state=my_match[1];
		    ret_add.zip=my_match[2];
		}
	    }
	    ret_add.street="";
	    ret_add.city=splits[0].trim();
	}
	if(ret_add.city===undefined || ret_add.state===undefined || ret_add.zip===undefined)
	{
	    to_parse=to_parse.replace(/\, ([\d]{5})\,? ([A-Z]{2})/, ", $2 $1");
	    console.log("to_parse="+to_parse);
	    var new_add=parseAddress.parseLocation(to_parse);
	    ret_add.street="";
	    if(new_add.number!==undefined)
	    {
		ret_add.street=ret_add.street+new_add.number+" ";
	    }
	    ret_add.street=ret_add.street+new_add.street+" ";
	    if(new_add.type!==undefined)
	    {
		ret_add.street=ret_add.street+new_add.type;
	    }
	    ret_add.street=ret_add.street.trim();
	    ret_add.city=new_add.city;
	    ret_add.state=new_add.state;
	    if(new_add.zip!==undefined) { ret_add.zip=new_add.zip; }
	    else { ret_add.zip=""; }
	    console.log("new_add="+JSON.stringify(new_add));
	}
	return ret_add;
    }
    this.get_domain_only=function(the_url,limit_one)
    {
	var httpwww_re=/https?:\/\/www\./;
	var http_re=/https?:\/\//;
	var slash_re=/\/.*$/;
	var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");

	if(limit_one)
	{
	    if(/\.(co|ac|gov)\.[A-Za-z]{2}$/.test(the_url))
	    {
		ret=ret.replace(/^.*\.([^\.]+\.(?:co|ac|gov)\.[A-Za-z]{2})$/,"$1");
	    }
	    else ret=ret.replace(/^.*\.([^\.]+\.[^\.]+$)/,"$1");
	}
	return ret;
    }
    this.prefix_in_string=function(prefixes, to_check)
    {
	var j;
	for(j=0; j < prefixes.length; j++) {
	    if(to_check.indexOf(prefixes[j])===0) return true;

	}
	return false;
    }
    this.parse_name=function(to_parse)
    {
	console.log("Doing parse_name on "+to_parse);
	var suffixes=["Jr","II","III","IV","CPA","CGM"];
	var prefixes=["Mr","Ms","Mrs","Dr","Rev"];
	var prefixes_regex=/^(Mr|Ms|Mrs|Dr|Rev|Miss)\.?\s+/gi;
	var paren_regex=/\([^\)]*\)/g;
	to_parse=to_parse.replace(paren_regex,"");
	to_parse=to_parse.replace(prefixes_regex,"");
	var split_parse=to_parse.split(" ");
	var last_pos=split_parse.length-1;
	var first_pos=0;
	var j;
	var caps_regex=/^[A-Z]+$/;
	var ret={};
	for(last_pos=split_parse.length-1; last_pos>=1; last_pos--)
	{
            if(!prefix_in_string(suffixes,split_parse[last_pos]))
	    {
		if(!(split_parse.length>0 && /[A-Z][a-z]/.test(split_parse[0]) && /^[^a-z]+$/.test(split_parse[last_pos])))
		{
		    //console.log("last_pos="+last_pos);
		    //console.log( /[A-Z][a-z]/.test(split_parse[0]));

		    break;
		}
	    }



	}
	/*for(first_pos=0; first_pos< last_pos; first_pos++)
	{
	    if(!prefix_in_string(prefixes,split_parse[last_pos])&&split_parse[last_pos]!=="Miss") break;
	}*/
	if(last_pos>=2 && /Van|de/.test(split_parse[last_pos-1]))
	{
	    ret.lname=split_parse[last_pos-1]+" "+split_parse[last_pos];
	}
	else ret.lname=split_parse[last_pos];
	ret.fname=split_parse[0];
	if(last_pos>=2 && split_parse[1].length>=1) {
            ret.mname=split_parse[1].substring(0,1); }
	else {
            ret.mname=""; }


	return ret;

    }

    this.shorten_company_name=function(name)
    {
	name=name.replace(/ - .*$/,"").trim().replace(/\s*plc$/i,"");
	name=name.replace(/\(.*$/i,"").trim();
	name=name.replace(/\s*Corporation$/i,"").replace(/\s*Corp\.?$/i,"");
	name=name.replace(/\s*Incorporated$/i,"").replace(/\s*Inc\.?$/i,"");
	name=name.replace(/\s*LLC$/i,"").replace(/\s*Limited$/i,"").replace(/\s*Ltd\.?$/i,"").trim();

	name=name.replace(/,\s*$/,"");
	name=name.replace(/\s+Pte$/i,"").replace(/ AG$/i,"");
	name=name.replace(/\s+S\.?A\.?$/i,"").replace(/\s+L\.?P\.?$/i,"");
	name=name.replace(/\s+GmbH$/i,"").replace(/\s+SRL/i,"")
	name=name.replace(/\s+Sarl$/i,"");

	return name;
    }
    /* do_bloomberg_snapshot parses
     * https://www.bloomberg.com/research/stocks/private/snapshot.asp?privcapId=[\d+] pages
     * doc the document to use to parse it, to allow use for either xmlhttprequest or open in
     *       new window
     */
    this.parse_bloomberg_snapshot=function(doc)
    {
        console.log("Doing bloomberg");
        var result={"phone":"","country":"",url:"","name":"","state":"","city":"","streetAddress":"","postalCode":""};

        var address=doc.querySelector("[itemprop='address']");
        var phone=doc.querySelector("[itemprop='telephone']");
        var name=doc.querySelector("[itemprop='name']");
        var url=doc.querySelector("[itemprop='url']");
        var executives=doc.querySelectorAll("[itemprop='member']");
        var add_match, add_regex=/^([^,]+)(?:,\s*(.*?))?\s*((?:[A-Z]*[\d]+[A-Z\d]+[A-Z]*))$/;

        if(phone!==null && phone!==undefined) result.phone=phone.innerText;

        if(address!==null && address!==undefined)
        {
            var add_split=address.innerText.split("\n");
            var add_len=add_split.length;
            var curr_pos=add_len-1,i;

            while(curr_pos>=0 && add_split[curr_pos].length<2) curr_pos--;
            console.log("add_len="+add_len);
            if(curr_pos>=0) {
                result.country=add_split[curr_pos]; }
            curr_pos--;
             while(curr_pos>=0 && add_split[curr_pos].length<2) curr_pos--;
            if(curr_pos>=0) {
                add_match=add_split[curr_pos].match(add_regex);
                console.log("add_match="+JSON.stringify(add_match));
                if(add_match)
                {
                    result.city=add_match[1];
                    result.state=add_match[2];
                    result.postalCode=add_match[3];
                }

            }

            result.streetAddress="";
            for(i=0; i < curr_pos; i++)
            {
                if(add_split[i].length<2) continue;
                result.streetAddress=result.streetAddress+add_split[i];
                if(i<curr_pos-1) result.streetAddress=result.streetAddress+",";
            }
            result.streetAddress=result.streetAddress.replace(/,$/,"");
        }
        if(url!==undefined && url!==null) { result.url=url.href; }
        if(name!==undefined && name!==null) { result.name=name.innerText; }
        result.name=shorten_company_name(result.name);
        console.log("result="+JSON.stringify(result));
        console.log("Setting bloom_result");
        GM_setValue("bloom_result",result);
        return;


    }
}

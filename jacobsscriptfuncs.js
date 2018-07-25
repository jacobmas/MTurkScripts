var state_map={"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE",
                   "District of Columbia": "DC", "Florida": "FL","Georgia": "GA", "Hawaii": "HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA",
                   "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts":"MA", "Michigan": "MI",
                   "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH",
                   "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
                   "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
                   "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
                   "Wisconsin": "WI", "Wyoming": "WY", "Ontario": "ON", "Quebec": "QC", "New Brunswick": "NB", "Alberta": "AB", "Saskatchewan": "SK",
                   "Manitoba": "MB", "British Columbia": "BC","Nova Scotia": "NS"};
function is_bad_url(the_url, bad_urls, check_function)
{
    var i;
    
    for(i=0; i < bad_urls.length; i++)
    {
        if(the_url.indexOf(bad_urls[i])!==-1) return true;
    }
    //console.log("the_url.split(\"/\").length="+the_url.split("/").length);
    //if(the_url.split("/").length>=5) return true;
    return false;
}

function my_parse_address(to_parse)
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
function get_domain_only(the_url)
{
    var httpwww_re=/https?:\/\/www\./;
    var http_re=/https?:\/\//;
    var slash_re=/\/.*$/;
    var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");
    return ret;
}
function prefix_in_string(prefixes, to_check)
{
    var j;
    for(j=0; j < prefixes.length; j++) {
        if(to_check.indexOf(prefixes[j])===0) return true;
    }
    return false;
}
function parse_name(to_parse)
{
    var suffixes=["Jr","II","III","IV","CPA","CGM"];
    var prefixes=["Mr","Ms","Mrs","Dr","Rev"];
    var paren_regex=/\([^\)]*\)/g;
    to_parse=to_parse.replace(paren_regex,"");
    
    var split_parse=to_parse.split(" ");
    var last_pos=split_parse.length-1;
    var first_pos=0;
    var j;
    var caps_regex=/^[A-Z]+$/;
    var ret={};
    for(last_pos=split_parse.length-1; last_pos>=1; last_pos--)
    {
        if(!prefix_in_string(suffixes,split_parse[last_pos])) break;

    }
    for(first_pos=0; first_pos< last_pos; first_pos++)
    {
	if(!prefix_in_string(prefixes,split_parse[last_pos])&&split_parse[last_pos]!=="Miss") break;
    }
    ret.lname=split_parse[last_pos];
    ret.fname=split_parse[0];
    if(last_pos>=2 && split_parse[1].length>=1) {
        ret.mname=split_parse[1].substring(0,1); }
    else {
        ret.mname=""; }
    return ret;

}

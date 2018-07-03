    function check_and_submit(check_function)
{
    console.log("in check");
    if(!check_function())
    {
        GM_setValue("returnHit",true);
        console.log("bad");
        return;
    }
    console.log("Checking and submitting");


    if(automate)
    {
        setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
    }
}
function is_bad_url(the_url)
{
    var i;
    
    for(i=0; i < bad_urls.length; i++)
    {
        if(the_url.indexOf(bad_urls[i])!==-1) return true;
    }
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

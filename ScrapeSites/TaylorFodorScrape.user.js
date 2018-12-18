// ==UserScript==
// @name         TaylorFodorScrape
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var my_query = {};

    var MTurk=new MTurkScript(20000,200,[],init_Query,"A14XZUR0ZPOC3J");

    function check_function() { return true;  }
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
	if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }

    function is_bad_name(b_name)
    {
	return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    lgb_info=doc.getElementById("lgb_info");



            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		p_caption="";
		if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
		    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
		}
		console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);



                if(!is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
		    break;

                }

            }
	    if(b1_success)
	    {
		/* Do shit */
		resolve(b_url);
		return;
	    }


        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {


    }

    function parse_njcaa(response)
    {
        //console.log("response="+JSON.stringify(response));
        var parsed=JSON.parse(response.responseText);
        GM_setValue("directory",parsed);
        var i,j;
        search_directory(parsed);
    }
    function search_directory(parsed)
    {
        var i,j;
        for(i=0; i < parsed.length; i++)
        {
           // console.log("parsed["+i+"].name="+JSON.stringify(parsed[i]));
            if(parsed[i].Name.toLowerCase().indexOf(my_query.short_name.toLowerCase())!==-1)
            {
                njcaa_then(parsed[i]);
                return;
            }
        }
    }

    function njcaa_then(result)
    {
        console.log("result="+JSON.stringify(result));
        var new_url="http://api.njcaa.org/Common/GetColleges/"+result.Id;
        GM_xmlhttpRequest({method: 'GET', url: new_url,
                           responseType:"json",
                           onload: function(response) {
                               //console.log("response="+response.responseText);
                               parse_team(response); },
                           onerror: function(response) { console.log("Fail specific"); },
                           ontimeout: function(response) { console.log("Fail specific"); }
                          });

    }

    function parse_team(response)
    {
        var parsed=JSON.parse(response.responseText);
        parsed=parsed[0];
        console.log("response.responseText="+response.responseText);
        if(parsed.SchoolColors!==undefined && parsed.SchoolColors)
        {
            my_query.fields["School Colors"]=parsed.SchoolColors.toString();
        }
        if(parsed.MascotName!==undefined && parsed.MascotName)
        {
            my_query.fields["Mascot"]=parsed.MascotName.toString();
        }
        if(parsed.Twitter!==undefined && parsed.Twitter)
        {
            my_query.fields["Twitter"]=parsed.Twitter.toString();
        }
        if(parsed.Facebook!==undefined && parsed.Facebook)
        {
            my_query.fields["Facebook"]=parsed.Facebook.toString();
        }
        add_to_sheet();
        MTurk.check_and_submit();
    }

    function add_to_sheet()
    {
        for(var x in my_query.fields) {
            if(document.getElementById(x) && my_query.fields[x].length>0)
            {
                document.getElementById(x).value=my_query.fields[x].replace(/\[[^\]]*\]/g,"");
            }
        }
    }


    function parse_wiki(doc,url,resolve,reject)
    {
        var infobox=doc.getElementsByClassName("infobox"),i,j;
        if(infobox.length>0)
        {
            var table=infobox[0];
            var curr_row;
            for(i=0; i < table.rows.length; i++)
            {
                curr_row=table.rows[i];
                if(curr_row.cells.length>=2)
                {
               //     console.log("curr_row="+curr_row.innerText);
                    my_query.fields[curr_row.cells[0].innerText]=curr_row.cells[1].innerText;
                }
            }
        }
        console.log("my_query.fields="+JSON.stringify(my_query.fields));
        add_to_sheet();
        check_and_submit(check_function);

    }
    function wiki_then(result)
    {
    }


    function init_Query()
    {
        console.log("in init_query");
        var i;
        var row=document.getElementsByClassName("row");

        var dont=document.getElementsByClassName("dont-break-out");
        var name="",label,website="";
        for(i=0; i < row.length; i++)
        {
            dont=row[i].getElementsByClassName("dont-break-out");
            label=row[i].getElementsByTagName("label");
            if(label.length>0 && label[0].innerText.indexOf("College")!==-1 && dont.length>0)
            {
                name=dont[0].innerText;
                break;
            }
            else if(label.length>0&&label[0].innerText.indexOf("Link to the Website")!==-1 && dont.length>0)
            {
                website=dont[0].innerText;
            }
        }
//          var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:name,fields:{}};
        my_query.short_name=my_query.name.replace(/\s*[&-,]+.*$/,"").trim();
        console.log("my_query="+JSON.stringify(my_query));
        var url="http://api.njcaa.org//Common/GetColleges";
        var promise;
        if(website.indexOf("wikipedia.org")===-1)
        {
            if((GM_getValue("directory")===undefined || GM_getValue("directory")===null))
            {
                console.log("Searching with request");
                GM_xmlhttpRequest({method: 'GET', url: url,
                                   responseType:"json",
                                   onload: function(response) {
                                       console.log("response="+response.responseText);
                                       parse_njcaa(response); },
                                   onerror: function(response) { console.log("Fail"); },
                                   ontimeout: function(response) { console.log("Fail"); }
                                  });
            }
            else
            {
                console.log("Found directory");
                search_directory(GM_getValue("directory"));
            }
        }
        else
        {
            var wiki_url="https://en.wikipedia.org/wiki/"+my_query.name.replace(/\s/g,"_");
            promise=MTurkScript.prototype.create_promise(wiki_url,parse_wiki,wiki_then);
        }

	/*var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/





    }

})();

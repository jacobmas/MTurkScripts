// ==UserScript==
// @name         WinterMason
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Grabs data for local election officials
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.yahoo.com*
// @include file://*
// @include https://www.fvap.gov*
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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;
    var state_map_only={"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE",
                 "Florida": "FL","Georgia": "GA", "Hawaii": "HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA",
                   "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts":"MA", "Michigan": "MI",
                   "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH",
                   "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
                   "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
                   "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
                   "Wisconsin": "WI", "Wyoming": "WY"};
    var good_state_map={};

     var stateranges={


                      "Arkansas":[572,646],
                      "California":[647,704],
         "Florida":[942,1008],
                       "Iowa":[1578,1676],
                      "Indiana":[2861,2952],
                      "Oklahoma":[4110,4186],
                      "Oregon":[4187],



                      "Washington":[5201,5239],
                      "West Virginia":[5240,5294],
         /* Blank region */
         "Connecticut":[16130,16298],
                      "Georgia":[16299,16457],

                      "Kansas":[16458,16562],
          "Louisiana":[16563,16626],
         "Missouri":[16627,16742],
         "New Hampshire":[16743,16978],
                       "North Dakota":[16979,17031],
                       "South Dakota":[17032,17097],
                      "Maine":[17098,17604],
                    "Maryland":[17605,17628],
         "Alaska":[17630,17635],
         "Michigan":[17636,17744],


                      "Minnesota":[3062,3148],
                      "Mississippi":[3149,3230],
                      "Tennessee":[4442,4536],
                     "Texas":[4537,4790]};


    var state_fips=[
        {"name":"Alabama","abbrev":"AL","fips":1},
        {"name":"Alaska","abbrev":"AK","fips":2},
        {"name":"Arizona","abbrev":"AZ","fips":4},
        {"name":"Arkansas","abbrev":"AR","fips":5},
        {"name":"California","abbrev":"CA","fips":6},
        {"name":"Colorado","abbrev":"CO","fips":8},
        {"name":"Connecticut","abbrev":"CT","fips":9},
        {"name":"Delaware","abbrev":"DE","fips":10},
        {"name":"District of Columbia","abbrev":"DC","fips":11},
        {"name":"Florida","abbrev":"FL","fips":12},
        {"name":"Georgia","abbrev":"GA","fips":13},
        {"name":"Hawaii","abbrev":"HI","fips":15},
        {"name":"Idaho","abbrev":"ID","fips":16},
        {"name":"Illinois","abbrev":"IL","fips":17},
        {"name":"Indiana","abbrev":"IN","fips":18},
        {"name":"Iowa","abbrev":"IA","fips":19},
        {"name":"Kansas","abbrev":"KS","fips":20},
        {"name":"Kentucky","abbrev":"KY","fips":21},
        {"name":"Louisiana","abbrev":"LA","fips":22},
        {"name":"Maine","abbrev":"ME","fips":23},
        {"name":"Maryland","abbrev":"MD","fips":24},
        {"name":"Massachusetts","abbrev":"MA","fips":25},
        {"name":"Michigan","abbrev":"MI","fips":26},
        {"name":"Minnesota","abbrev":"MN","fips":27},
        {"name":"Mississippi","abbrev":"MS","fips":28},
        {"name":"Missouri","abbrev":"MO","fips":29},
        {"name":"Montana","abbrev":"MT","fips":30},
        {"name":"Nebraska","abbrev":"NE","fips":31},
        {"name":"Nevada","abbrev":"NV","fips":32},
        {"name":"New Hampshire","abbrev":"NH","fips":33},
        {"name":"New Jersey","abbrev":"NJ","fips":34},
        {"name":"New Mexico","abbrev":"NM","fips":35},
        {"name":"New York","abbrev":"NY","fips":36},
        {"name":"North Carolina","abbrev":"NC","fips":37},
        {"name":"North Dakota","abbrev":"ND","fips":38},
        {"name":"Ohio","abbrev":"OH","fips":39},
        {"name":"Oklahoma","abbrev":"OK","fips":40},
        {"name":"Oregon","abbrev":"OR","fips":41},
        {"name":"Pennsylvania","abbrev":"PA","fips":42},
        {"name":"Rhode Island","abbrev":"RI","fips":44},
        {"name":"South Carolina","abbrev":"SC","fips":45},
        {"name":"South Dakota","abbrev":"SD","fips":46},
        {"name":"Tennessee","abbrev":"TN","fips":47},
        {"name":"Texas","abbrev":"TX","fips":48},
        {"name":"Utah","abbrev":"UT","fips":49},
        {"name":"Vermont","abbrev":"VT","fips":50},
        {"name":"Virginia","abbrev":"VA","fips":51},
        {"name":"Washington","abbrev":"WA","fips":53},
        {"name":"West Virginia","abbrev":"WV","fips":54},
        {"name":"Wisconsin","abbrev":"WI","fips":55},
        {"name":"Wyoming","abbrev":"WY","fips":56}
    ];

    var state_code={"Missouri":28};

    function get_fips(state)
    {
        var i;
        for(i=0; i<state_fips.length; i++)
        {
            if(state===state_fips[i].name)
            {
                return parseInt(state_fips[i].fips);
            }
        }
        return 0;
    }

    function check_function()
    {
	return true;
    }
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

    function fix_commissioner_title()
    {
        console.log("in fix commissioner title "+my_query.state);
        if(my_query.state==="TX"||my_query.state==="Texas") return "Elections Administrator";
        if(my_query.state==="Kansas"||my_query.state==="KS" || my_query.state==="West Virginia"||
          my_query.state==="Missouri" || my_query.state==="Illinois" || my_query.state==="Michigan"
          || my_query.state==="Nebraska" || my_query.state==="Idaho") return "County Clerk";
        if(my_query.state==="Arkansas") return "Election Commissioner";
         if(my_query.state==="Iowa"||my_query.state==="IA"||my_query.state==="North Dakota"||
           my_query.state==="South Dakota" || my_query.state==="Washington") return "County Auditor";
        if(my_query.state==="Virginia") return "Registrar";
        if(my_query.state==="North Carolina" ) return "Elections Director";
        if(my_query.state==="Georgia") return "Election Supervisor";
        if(my_query.state==="Florida") return "Supervisor of Elections";
        if(my_query.state==="Oklahoma") return "Election Board Secretary";
        if(my_query.state==="Tennessee") return "Administrator of Elections";
        if(my_query.state==="Indiana") return "Election Administrator";
        if(my_query.state==="Pennsylvania"|| my_query.state==="Ohio") return "Director of Elections";
        return my_query.results.commissioner_title;
    }
    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var regionMatch;
        var regexpco=new RegExp(my_query.county,"i"), regexpstate=new RegExp(my_query.state,"i");
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");//[0].innerText;
                if(b_caption.length===0) continue;
                if(b_caption.length>0)
                {
                    console.log("i="+i+", b_url="+b_url+", b_caption="+b_caption[0].innerText);
                }
                if(!regexpco.test(b_caption[0].innerText) || !regexpstate.test(b_caption[0].innerText))
                {
                    console.log("Failed at testing regex, continue");
                    continue;
                }


                if(/regionId=(\d+)$/.test(b_url))
                {
                    console.log("Found regionId");
                    regionMatch=b_url.match(/regionId=(\d+)$/);
                    if(regionMatch[1]!=="0")
                    {
                        resolve({regionId: regionMatch[1]});
                        return;
                    }
                }
                else if(/leoId=(\d+)$/.test(b_url))
                {
                    console.log("Found leoId");
                    regionMatch=b_url.match(/leoId=(\d+)$/);
                    if(regionMatch[1]!=="0")
                    {

                        resolve({leoId: regionMatch[1]});
                        return;
                    }
                }
            }



        }
        catch(error)
        {
            console.log("Error "+error);
            reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(my_query.try_count===0)
        {
            my_query.try_count++;
            query_search(my_query.county+" site:usvotefoundation.org",resolve,reject,query_response);
            return;
        }
        else
        {
            my_query.try_count++;
            if(my_query.state==="Missouri" || stateranges[my_query.state]!==undefined)
            {
                get_JSON(resolve,reject);
                return;
            }
            google_search(my_query.county+" "+my_query.state+" site:usvotefoundation.org",resolve,reject,google_response);
        }
         //   reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    function google_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in google_response\n"+response.finalUrl);
        var search, g_algo, i=0, inner_a;
        var g_url="crunchbase.com", g_name, b_factrow, g_caption;
        var b1_success=false, b_header_search;
        var regionMatch;
        var regexpco=new RegExp(my_query.county,"i"), regexpstate=new RegExp(my_query.state,"i");
        try
        {
            search=doc.getElementById("search");
            g_algo=search.getElementsByClassName("g");

            console.log("g_algo.length="+g_algo.length);

            for(i=0; i < g_algo.length; i++)
            {
                g_name=g_algo[i].getElementsByTagName("a")[0].textContent;
                g_url=g_algo[i].getElementsByTagName("a")[0].href;
                g_caption=g_algo[i].getElementsByClassName("st");//[0].innerText;
                if(g_caption.length===0) continue;
                if(g_caption.length>0)
                {
                    console.log("i="+i+", g_url="+g_url+", g_caption="+g_caption[0].innerText);
                }
                if(!regexpco.test(g_caption[0].innerText) || !regexpstate.test(g_caption[0].innerText))
                {
                    console.log("Failed at testing regex, continue");
                    continue;
                }


                if(/regionId=(\d+)$/.test(g_url))
                {
                    console.log("Found regionId");
                    regionMatch=g_url.match(/regionId=(\d+)$/);
                    if(regionMatch[1]!=="0")
                    {
                        resolve({regionId: regionMatch[1]});
                        return;
                    }
                }
                else if(/leoId=(\d+)$/.test(g_url))
                {
                    console.log("Found leoId");
                    regionMatch=g_url.match(/leoId=(\d+)$/);
                    if(regionMatch[1]!=="0")
                    {

                        resolve({leoId: regionMatch[1]});
                        return;
                    }
                }
            }



        }
        catch(error)
        {
            console.log("Error "+error);
            reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
       /* if(my_query.try_count===0)
        {
            my_query.try_count++;
            query_search(my_query.county+" site:usvotefoundation.org",resolve,reject,query_response);
            return;
        }*/
        console.log("Doing json");
        get_JSON(resolve,reject);
        return;
//        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

        /* Following the finding the district stuff */
    function query_promise_then(region) {
        console.log("in query_promise_then "+JSON.stringify(region));
        var result=region;
        var url="https://www.overseasvotefoundation.org/vote/eodCorrections.htm?";
        //url=url+"stateId="+(get_fips(my_query.state)-1)+"&";
        if(result.regionId!==undefined) url=url+"regionId="+result.regionId;
        else if(result.leoId!==undefined) url=url+"leoId="+result.leoId;
        else if(typeof(result)!=="Object") url=url+"regionId="+result;
        console.log("url="+url);
        GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { overseas_response(response); },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });
        return;


    }

    function overseas_response(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        my_query.results={};
        console.log("in overseas_response\n"+response.finalUrl);
      //  console.log("doc.body.innerText="+doc.body.innerText);
        var tables=doc.getElementsByClassName("local-election-official"), curr_row,office_name="";
        var i,j;
        console.log("tables.length="+tables.length);
        for(i=0; i < tables.length; i++)
        {
            console.log("in tables["+i+"]");
            my_query.results={};
            for(j=0; j < tables[i].rows.length; j++)
            {
                curr_row=tables[i].rows[j];
               // console.log("curr_row="+curr_row.innerText);
                if(/Office Name/i.test(curr_row.cells[0].innerText))
                {

                     my_query.results.commissioner_title=curr_row.cells[1].innerText.replace(/Office Name/,"").trim();
                     console.log("Found title="+my_query.results.commissioner_title);
                    office_name=my_query.results.commissioner_title;
                }
                else if(new RegExp(office_name,"i").test(curr_row.cells[0].innerText))
                {
                    console.log("Found name="+curr_row.cells[1].innerText);

                    my_query.results.commissioner_name=curr_row.cells[1].innerText.replace(/Official Name/,"").trim();
                }
                else if(/Email Address/i.test(curr_row.cells[0].innerText))
                {
                    console.log("Found email="+curr_row.cells[1].innerText);

                    my_query.results.commissioner_email=curr_row.cells[1].innerText.replace(/Email Address/,"").trim();
                }


            }
            if(my_query.results.commissioner_name!==undefined && my_query.results.commissioner_email!==undefined)
            {
                my_query.results.commissioner_title=fix_commissioner_title(my_query.results.commissioner_title);
                add_to_sheet(my_query.results);
                check_and_submit(check_function,automate);
                return;
            }
        }



    }

    function vote_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        my_query.results={};
        console.log("in vote_response\n"+response.finalUrl);

       var contact=doc.getElementById("collapseEodContact"),table,i,j,x,curr_row,success=false;
        if(contact===null)
        {
            console.log("Error collapse thing is null");
            return;
        }
        table=contact.getElementsByTagName("table")[0];
        my_query.results.commissioner_title=table.rows[0].cells[0].innerText;
        my_query.results.commissioner_name=table.rows[0].cells[1].innerText;
        for(i=1; i < table.rows.length; i++)
        {
            curr_row=table.rows[i];
            console.log("curr_row.length="+curr_row.cells.length+"\tcurr_row.innerText="+curr_row.innerText);
            if(/Email Address/i.test(curr_row.cells[0].innerText))
            {
                my_query.results.commissioner_email=curr_row.cells[1].innerText;
                success=true;
                break;
            }
        }
        if(success)
        {
            console.log("success!");
            if(my_query.results.commissioner_title.trim()==="Local Election Official"||
              my_query.results.commissioner_title.trim()==="County Election Official")
            {
                my_query.results.commissioner_title=fix_commissioner_title();
            }
            add_to_sheet(my_query.results);
            check_and_submit(check_function,automate);
            return;
        }
        else
        {
            console.log("Fail");
            GM_setValue("returnHit",true);
        }




    }
    function add_to_sheet(results)
    {
        var x;
        for(x in results)
            {
                document.getElementById(x).value=results[x].trim();
            }
    }

    /* Search on bing for search_str, parse bing response with callback */
    function vote_search(resolve,reject, callback) {
        console.log("Searching for "+my_query.county+", "+my_query.state);
        var search_URI='https://www.overseasvotefoundation.org/vote/election-official-directory/'+
            encodeURIComponent(my_query.state)+"/"+encodeURIComponent(my_query.county)+"?submission=true";
	 
	GM_xmlhttpRequest({method: 'GET', url: search_URI,
            onload: function(response) { vote_response(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

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

        function google_search(search_str, resolve,reject, callback) {
            console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.google.com/search?q='+
	    encodeURIComponent(search_str);//+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }


    function try_ranges(resolve,reject,low,high)
    {

        var url="https://www.overseasvotefoundation.org/vote/eodCorrections.htm?regionId=";
        var to_do=Math.floor((low+high)/2);
         console.log("low="+low+", high="+high+", to_do="+to_do);
        url=url+to_do;
        console.log("url="+url);
        GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) {
                 var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
                //console.log("doc.body.innerHTML="+doc.body.innerHTML);
                var eod=doc.getElementById("eod-corrections");
                var h3=eod.getElementsByTagName("h3")[0];
                var text=h3.innerText.split("-");
                if(text.length===0) { console.log("Error text"); return; }
                var county=text[1].trim();
                console.log("county="+county);
                if(county===my_query.county)
                {
                    console.log("Resolving on "+to_do);
                    resolve(to_do);
                    return;
                }
                if(/^Saint\s/.test(county)) county=county.replace(/^Saint\s/,"St. ");

                if(my_query.county < county)
                {
                    if(low<to_do)
                    {
                        try_ranges(resolve,reject,low,to_do-1);
                    }
                }
                else
                {
                    if(to_do<high)
                    {
                        try_ranges(resolve,reject,to_do+1,high);
                    }
                }

            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    function get_JSON(resolve,reject)
    {
        console.log("good_state_map["+my_query.state+"]="+ good_state_map[my_query.state]+"\t"+
                    "get_fips("+my_query.state+")="+get_fips(my_query.state));
        var url="https://www.usvotefoundation.org/vote/ajax/getJsonRegions.htm?stateId="+
            (get_fips(my_query.state)-1);
        var range=stateranges[my_query.state];
        if(range!==undefined)
        {
            try_ranges(resolve,reject,range[0],range[1]);
            return;
        }
        console.log("Doing jsonbob");
        GM_xmlhttpRequest({method: 'GET', url: url, responseType:'json',
            onload: function(response) {
                console.log("in response");
                var x;
                for(x in response)
                {
                    console.log("response["+x+"]="+response[x]);
                }
                //console.log("response="+response.responseText);
                //console.log("response="+JSON.parse(response));
                var result=JSON.parse(response.responseText);
                var i;
                for(i=0; i < result.length; i++)
                {
                    console.log("result["+i+"].text="+result[i].text);
                    if(result[i].text===my_query.county)
                    {
                        console.log("Found it "+result[i].id);
                        resolve({regionId: result[i].id});
                        return;
                    }
                }




                                       },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }




    function parse_ND(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var short_county=my_query.county.replace(/\sCounty$/i,"");
        var rg=doc.getElementsByClassName("rgMasterTable")[0];
        var i;
        var curr_row;
        for(i=1; i < rg.rows.length; i++)
        {
            curr_row=rg.rows[i];
            if(short_county===curr_row.cells[1].innerText)
            {
                console.log("Found county at "+i);
            }
        }

    }



    function do_fvap()
    {
        console.log("Doing fvap "+window.location.href);
        var table=document.getElementById("offices");
        var i;
        my_query.results={};
        for(i=1; i <table.rows.length; i++)
        {
            console.log("i="+i+", table.rows[i].innerText="+table.rows[i].innerText);
             my_query.results.commissioner_title=table.rows[i].cells[0].innerText;
            my_query.results.commissioner_email=table.rows[i].cells[5].innerText;
            if(true)
            {
                my_query.results.commissioner_name=my_query.results.commissioner_email.replace(/@.*$/,"").replace("."," ")
                .replace(/([^\s]+)\s([^\s]+)/, function(match,p1,p2)
                         {
                    var ret="";
                    ret=ret+p1.substr(0,1).toUpperCase()+p1.substr(1)+" "+p2.substr(0,1).toUpperCase()+p2.substr(1);
                    return ret;
                });
                GM_setValue("result",my_query.results);
                return;
            }
            else
            {
                console.log("Failed on state");
            }
        }
    }


    function init_Query()
    {
        //var dont=document.getElementsByClassName("dont-break-out")[0].href;

        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var search_str;

        my_query={state:wT.rows[0].cells[1].innerText, county:wT.rows[1].cells[1].innerText,try_count:0};
        my_query.county=my_query.county.replace(/^St\./,"Saint");
        if(my_query.state==="Kentucky")
        {
            GM_setValue("result","");
            GM_addValueChangeListener("result",function()
                                      {
                var result=arguments[2];
                console.log("result="+result);
                add_to_sheet(result);
                check_and_submit(check_function,automate);
                return;
            });
          GM_setValue("my_query",my_query);

        }
        else if(my_query.state==="Maine"||my_query.state==="New Hampshire"
               ||my_query.state==="Vermont"||my_query.state==="Alaska"||my_query.state==="Connecticut"
               ||my_query.state==="Rhode Island"||my_query.state==="Massachusetts")
                {
                    console.log("FAil");
                    return;
                }
        else
        {
            search_str="+\""+my_query.county+"\" "+my_query.state+" site:usvotefoundation.org";
            const queryPromise1 = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str,resolve,reject,query_response);
            })
            queryPromise1.then(query_promise_then
                             )

        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

          /*  const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                vote_search(resolve,reject,vote_response);
            })
            queryPromise.then(query_promise_then
                             )

        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
        }





	




    }


    var x;
    var counter=1;
    for(x in state_map_only)
    {
        good_state_map[x]=counter;
        console.log("x="+x+", counter="+(counter));
        counter++;
    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("fvap.gov")!==-1)
    {
        GM_setValue("my_query","");
        GM_addValueChangeListener("my_query",function() {
            my_query=arguments[2];
            var url="https://www.fvap.gov/search-offices?state="+good_state_map[my_query.state]+"&jurisdiction=&name="+my_query.county.replace(/\s/g,"+");
            window.location.href=url;        });
        setTimeout(do_fvap,1000);
    }
    else if(window.location.href.indexOf("yahoo.com")!==-1)
    {
    }
    else if(window.location.href.indexOf("worker.mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating */
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 20000);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */

       
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();

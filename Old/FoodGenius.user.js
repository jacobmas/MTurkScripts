// ==UserScript==
// @name         FoodGenius
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Get Restaurant hompepage, Needs Cleanup Work
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant GM_deleteValue
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var MTurk=new MTurkScript(20000,200,[],begin_script,"A3W0AYFYLP1OIS",false);
    var MTP=MTurkScript.prototype;
   
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["www.mapquest.com","local.yahoo.com","yelp.com","birdeye.com","findglocal.com",
                 "facebook.com","menupix.com","www.tripadvisor.com","www.zomato.com","foursquare.com","manta.com",
                 "yellowpages.com","whitepages.com","moviefone.com","s3.amazonaws.com","walkscore.com","superpages.com",
                     "bizapedia.com","restaurants.com","city-data.com","www.yelp.com","www.grubhub.com",".hub.biz","groupon.com","beyondmenu","allmenus.com",
                 "eat24.com","cruisinwaiter","netwaiter","runinout","slicelife.com","doordash.com","usplaces.com","usmenuguide.com",
                  "local?","tripadvisor","realtor.com","youtube.com","2findlocal.com","durham-nc.com","yellowbook.com","www.trip.com",
                 "bringmethat.com","ratebeer.com","singlepage.com","opentable.com","singleplatform.com",".org","finduslocal.com",
                 "menuism.com","newyorkdiningclub.com","www.visit","buzzfile.com","intercreditreport.com","linkedin.com",
                 "indeed.com","yelp.de","bedandbreakfast.com",".business.site","speisekarte.menu",".gov","locality.com",
                 "citymaps.com","advrider.com","twitter.com","findmeglutenfree.com",".net","hotfrog.com","foodtrucksin.com",
                 "ourvalleyevents.com",".pdf","locu.com","restaurantguru.com","chinesemenu.com","trycaviar","beyondmenu","allmenus","groupon.com",
                 "tripadvisor.com","alohaorderonline.com","singleplatform.com","timetemperature.com","www.restaurant.com","menutoeat.com",
                  "cylex.us.com","www.zillow.com","www.realtor.com","www.trulia.com","www.homes.com","s3.amazonaws.com",
                  "www.yelp.co","www.yooying.com",".opendi.us","tablehero.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function bad_email_url(to_check)
    {
        let i;
        for(i=0; i < bad_urls.length; i++)
        {
            if(to_check.indexOf(bad_urls[i])!==-1) return true;
        }
        return false;
    }

    function check_function() { return true;  }

    function is_bad_url2(the_url)
    {
        var i;
        var bad_re=/https?:\/\/[^\/]*\/[^\/]*\/[^\/]*\//;
        var split_url=the_url.split("/");
        if(split_url.length>=4)
        {
            console.log("split_url[3]="+split_url[3]);
            let dash_split=split_url[3].split("-");
            if(dash_split.length>=3) return true;
        }
        if(split_url.length>=3)
        {
            console.log("split_url[2]="+split_url[2]);
            let dot_split=split_url[2].split(".");

            let first=my_query.name.replace(/[^A-Z]+/g,"").toLowerCase();
            console.log("first="+first);
           if(dot_split.length>=2 && dot_split[0]!=="www" && dot_split[0].indexOf(first)!==-1
              && !/com|org|net|io|site|biz|(^[a-z]{2,3}$)/.test(dot_split[1])
              ) return true;
        }
        return false;
    }
    function add_to_sheet(address,phone)
    {
        if(address.state===undefined || address.city===undefined || address.state===undefined)
        {
            GM_setValue("returnHit"+MTurk.assignmenet_id,true);
        }
        document.getElementById("addressLine1").value=address.street;
        document.getElementById("city").value=address.city;
        document.getElementById("state").value=address.state;
        document.getElementById("zip").value=address.zip;
        document.getElementById("phoneNumber").value=phone;

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

    function camp_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in camp_response");
       // var temp_href=my_query.href.replace(/https?:\/\/(www)?/,"");

//        for(var i in response) console.log("i="+i+", "+response[i]);
       console.log(response.finalUrl);
        var search;

        var b_algo;
     //   var g_stuff;
        var i;
       // var g1_success=false;
        var b_url="crunchbase.com", b_name;
        var b_top;
        var good_url,found_url=false;
        var lgb_info;
        var b_context;
        var b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var inner_a;
        var name_split;
        var the_address="";
        var the_phone="";
        var b_vList, b_entityTP, cbl,p_caption;

        var job_text,job_split;
        var add_success=false, phone_success=false;
        var epc;
        var permanent="";
        try
        {
            search=doc.getElementById("b_content");
            lgb_info=doc.getElementById("lgb_info");
            console.log("hello");
            permanent=doc.getElementById("permanentlyClosedIcon");
            if(permanent)
            {
                console.log("Permanently closed!");
                document.getElementsByName("closed")[0].checked=true;
                GM_setValue("closed",my_query.closed+1);
                MTurk.check_and_submit();
                return;
            }
            if(lgb_info!==null && lgb_info!==undefined)
            {
                console.log("lgb_info");
                inner_a=lgb_info.getElementsByTagName("a");
                if(inner_a!==null && inner_a!==undefined && inner_a.length>0 &&
                   !MTP.is_bad_url(inner_a[0].href.replace(/\/$/,""),bad_urls,5,2) && !is_bad_url2(inner_a[0].href))
                {
                    console.log("Glunk");
                    document.getElementById("webpage_url").value=inner_a[0].href;
                    GM_setValue("success",my_query.success+1);
                    MTurk.check_and_submit();
                    return;
                }
                else if(inner_a.length>0)
                {
                    console.log("lgbinfo:inner_a[0].href="+inner_a[0].href+", is_bad_url(*)="+is_bad_url(inner_a[0].href,bad_urls));
                }
            }

            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                return;
            }

            i=0;
            var loc_re=/Location: (.*)\s*Phone: (.*)$/;
            var loc_phone_re=/Phone: (.*)\s*Location: (.*)$/;
            var add_re=/Address: (.*)\s*Phone: ([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/;
            var loc_match;
            for(i=0; i < b_algo.length && i < 5; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);

                if(!MTP.is_bad_url(b_url,bad_urls,5,2) && !is_bad_url2(b_url,bad_urls) && i < 2)
                {
                    document.getElementById("webpage_url").value=b_url;
                    GM_setValue("success",my_query.success+1);
                    MTurk.check_and_submit();
                    return;

                }
                else if(!MTP.is_bad_url(b_url,bad_urls,5,2) && !is_bad_url2(b_url,bad_urls))
                {
                    console.log("BAD can't guess");
                    GM_setValue("return",my_query.return+1);
                    GM_setValue("returnHit"+MTurk.assignment_id,true);
                    return;
                }


            }
            console.log("MOO");
            if(my_query.try_count===0)
            {
                my_query.try_count++;
                query_search(my_query.name+" "+my_query.city+" "+my_query.state,resolve,reject,camp_response);
                return;
            }
            GM_setValue("no_webpage",my_query.no_webpage+1);
            document.getElementsByName("no_page")[0].checked=true;
            MTurk.check_and_submit();
            return;


        }
        catch(error)
        {
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
            //console.log("Error "+error);
            //reject(JSON.stringify({error: true, errorText: error}));
        }
        GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;

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
    
      

    function get_domain_only(the_url)
    {
        var httpwww_re=/https?:\/\/www\./;
        var http_re=/https?:\/\//;
        var slash_re=/\/.*$/;
        var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");
        return ret;
    }
    /* Following the finding the district stuff */
    function camp_promise_then(to_parse) {

        var search_str, search_URI, search_URIBing;
        var search_result=JSON.parse(to_parse);
        console.log("search_result="+to_parse);
        var name_split;
       // var dist_test_re=/(district$)|(schools$)|(department of education$)/i;
        if(!search_result.error)
        {
            console.log("No error");
            /* we got a good result */
            document.getElementById("webpage_url").value=search_result.url;
            MTurk.check_and_submit();
        }
        else
        {
            if(search_result.noURLS===true)
            {
                console.log("search_result.noURLS="+search_result.noURLS);
                document.getElementsByName("no_page")[0].checked=true;
                MTurk.check_and_submit();
            }
            else
            {
                /* Didn't get a new URL, quit */
                console.log("Had an error: "+search_result.errorText);
                GM_setValue("returnHit"+MTurk.assignment_id,true);
                return false;
            }
        }

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
        var split_parse=to_parse.split(" ");
        var last_pos=split_parse.length-1;
        var j;
        var caps_regex=/^[A-Z]+$/;
        var ret={};
        for(last_pos=split_parse.length-1; last_pos>=1; last_pos--)
        {
            if(!prefix_in_string(suffixes,split_parse[last_pos]) && !caps_regex.test(split_parse[last_pos])) break;

        }
        ret.lname=split_parse[last_pos];
        ret.fname=split_parse[0];
        if(last_pos>=2 && split_parse[1].length>=1) {
            ret.mname=split_parse[1].substring(0,1); }
        else {
            ret.mname=""; }
        return ret;

    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function init_Query() {

       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var i;
        var curr_sib;


        my_query={name: wT.rows[0].cells[1].innerText, address: wT.rows[1].cells[1].innerText, city: wT.rows[3].cells[1].innerText,
                 state: wT.rows[4].cells[1].innerText, zip: wT.rows[5].cells[1].innerText, try_count:0};
        my_query.closed=GM_getValue("closed",0);
        my_query.no_webpage=GM_getValue("no_webpage",0);
        my_query.success=GM_getValue("success",0);
        my_query.return=GM_getValue("return",0);

        my_query.name=my_query.name.replace(/^BDW\s*/,"").replace(/\s+[A-Z]*\d{1,2}\/\d{1,2}$/,"")
        .replace(/-.*$/,"");
        my_query.name=my_query.name.replace(/(^|\s)([A-Za-z0-9\-\.]+)\/(?:[^\s]+)/,"$1$2")


        console.log("my_query="+JSON.stringify(my_query));

        var search_str, search_URI, search_URIBing;
        search_str=my_query.name+" "+my_query.address+" "+my_query.city+" "+my_query.state;

        const campPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str,resolve, reject,camp_response);
        });
        campPromise.then(camp_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });





    }


})();

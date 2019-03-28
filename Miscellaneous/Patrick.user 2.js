// ==UserScript==
// @name         Patrick
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
// @grant GM_setClipboard
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

(function() {
    'use strict';
    var my_query = {};
    var MTurk=new MTurkScript(20000,200,[],init_Query,"A2N21U92BJWQC5");

    var bad_urls=[];
    function is_bad_name(b_name)
    {
        return false;
    }

    function is_bad_site(b_url) {
        return /\/pages\//.test(b_url);
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    lgb_info=doc.getElementById("lgb_info");
	    b_context=doc.getElementById("b_context");
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
		if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && !is_bad_name(b_name) && !is_bad_site(b_url))
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
	    reject(error);
            return;
        }
	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    /* parse_ta_hours is a helper function for parse_trip_advisor */
    function parse_ta_hours(hrs) {
        console.log("parse_ta_hours: hrs="+JSON.stringify(hrs));
        var day_list=["Sat","Sun","Mon","Tue","Wed","Thu","Fri"],i,j,day_match,hrs_match,ret={};
        for(i=0; i < hrs.length; i++) {
            if(!/ - /.test(hrs[i].days)) hrs[i].days=hrs[i].days+" - "+hrs[i].days;
            if(!(day_match=hrs[i].days.match(/^([A-Za-z]{3}) - ([A-Za-z]{3})/))) continue;
            for(j=day_list.indexOf(day_match[1]); j<=day_list.indexOf(day_match[2]); j++) {
                ret[day_list[j]]=hrs[i].times; }




        }
        return ret;

    }

    /* Parses trip_advisor for some useful info like hours */
    function parse_trip_advisor(doc,url,resolve,reject) {
        var scripts=doc.scripts,i,ret={},context=null,x,responses=null;
        var context_regex=/^\{\"@context/,m_reg=/^define\(\'@ta\/page-manifest\',\[\],function\(\)\{return /;
        console.log("in parse_trip_advisor, url="+url+", scripts.length="+scripts.length);
        for(i=0; i < scripts.length; i++) {
            if(!context && context_regex.test(scripts[i].innerHTML) &&
               (context=JSON.parse(scripts[i].innerHTML))) ret.address=context.address;
            else if(m_reg.test(scripts[i].innerHTML) &&
                    (responses=JSON.parse(scripts[i].innerHTML.replace(m_reg,"").replace(/;\}\);$/,""))
                     .redux.api.responses)) {
                for(x in responses) {
                    if(/\/about\//.test(x)) {
                        ret.categories=responses[x].data.taxonomyInfos.map(x => x.name);
                        //ret.taxonomyInfos=responses[x].data.taxonomyInfos;
                        if(responses[x].data.displayHours) {
                            ret.hours=parse_ta_hours(responses[x].data.displayHours); }
                    }
                }
            }
        }
        resolve(ret);
    }

    function trip_promise_then(url) {
        console.log("trip_promise_then: url="+url);
        url=url.replace(/\ShowUserReviews/,"Attraction_Review").replace(/-r[\d]+-/,"-Reviews-");
        console.log("trip_advisour url="+url);
        var promise=MTurkScript.prototype.create_promise(url,parse_trip_advisor,parse_trip_advisor_then,temp_catch);
    }

    function parse_trip_advisor_then(result) {
        console.log("parse_trip_advisor_then: "+JSON.stringify(result));
        if((my_query.fields.address===undefined || my_query.fields.address.length===0) && result.address && result.address.streetAddress &&
           result.address.streetAddress.length>0) my_query.fields.address=result.address.streetAddress;
        if((my_query.fields.zip===undefined || my_query.fields.zip.length===0) && result.address && result.address.postalCode &&
           result.address.postalCode.length>0) my_query.fields.zip=result.address.postalCode;
        add_to_sheet();
    }



    function get_country_code(country) {
        var code="";
        var country_elem=document.getElementById("country"),i;
        for(i=0; i < country_elem.options.length; i++) {
                if(country_elem.options[i].innerText.trim()===country.trim()) code=country_elem.options[i].value;
            }
        return code;
    }
    function parse_foreign_address(address) {
        var ret={},match_zip,match_country,match_city,temp_country,i;

        if(match_zip=address.match(/\s+([\d\sA-Z\-]+)$/))
        {
            ret.zip=match_zip[1];
            address=address.replace(/\s+([\d\sA-Z\-]+)$/,"");
        }
        if(match_country=address.match(/,\s+([^,]*)$/))
        {
            temp_country=match_country[1];
            console.log("temp_country="+temp_country);
            ret.country=get_country_code(temp_country);

        }
        address=address.replace(/,\s+([^,]*)$/,"");
        if(match_city=address.match(/,\s+([^,]*)$/))
        {
            ret.city=match_city[1];
            address=address.replace(/,\s+([^,]*)$/,"");
        }
        ret.address=address;






        return ret;
    }

    function query_response_bing(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response_bing\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("vonkelb_algo.length="+b_algo.length);
            var context_result=MTurkScript.prototype.parse_b_context(b_context);
            if(context_result.Website) my_query.fields.web_url=context_result.Website;
            if(context_result.Phone && my_query.fields.phone_number===undefined) my_query.fields.phone_number=context_result.Phone;
            if(context_result.Facebook) my_query.fb_url=context_result.Facebook;
            if(context_result.latitude && context_result.longitude) {
                my_query.fields.latitude=context_result.latitude;
                my_query.fields.longitude=context_result.longitude; }
            console.log("context_result="+JSON.stringify(context_result));
            add_to_sheet();

        }
        catch(error)
        {
            reject(error);
            return;
        }
        resolve("Done bing search and grab");
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
    function fb_promise_then(fb_url) {
        my_query.about_url=fb_url.replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about";
        console.log("^ fb_about_url="+my_query.about_url);
        var home_promise=MTurkScript.prototype.create_promise(fb_url,MTurkScript.prototype.parse_FB_home,fb_home_then,temp_catch);
    }
    function temp_catch(response) {
        console.log("temp_catch response="+response);
    }
    function query_promise_then2(result)
    {
        var search_str;
        console.log("query_promise_then2: result="+result);
        if(my_query.fb_url) fb_promise_then(my_query.fb_url);
        else
        {
            search_str=my_query.name+" "+my_query.fields.country+" site:facebook.com";
            const fbPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response); });
            fbPromise.then(fb_promise_then).catch(function(val) {
                console.log("Failed at this fbPromise " + val); GM_setValue("returnHit",true); });
        }
    }

    function fb_home_then(result) {
        var parsedAdd,y;
        console.log("home result="+JSON.stringify(result));
        if(result.lat) my_query.fields.latitude=result.lat;
        if(result.lon) my_query.fields.longitude=result.lon;
        if(result.phone) my_query.fields.phone_number=result.phone;
        if(result.url) my_query.fields.web_url=result.url;
        if(result.addressInner && (parsedAdd=parse_foreign_address(result.addressInner)))
        {
            console.log("parsedAdd="+JSON.stringify(parsedAdd));
            for(y in parsedAdd) my_query.fields[y]=parsedAdd[y];
        }
        if(result.address && result.address.state && reverse_state_map[result.address.state]) {
            my_query.fields.country="US"; }
        var about_promise=MTurkScript.prototype.create_promise(my_query.about_url,MTurkScript.prototype.parse_FB_about,fb_about_then,temp_catch);


        add_to_sheet();

    }

    function time24totime12(time_str,uppercase) {
        if(uppercase===undefined) uppercase=true;
        var time_match,ret="",ampm="am",hrtime;
        if(!(time_match=time_str.match(/([\d]+):([\d]+)/))) return time_str;
        if((hrtime=parseInt(time_match[1]))>12) ret=ret+(hrtime-12);
        else if(hrtime===0) ret=ret+(hrtime+12);
        else ret=ret+(hrtime);
        ret=ret+":"+time_match[2];
        if(hrtime>=12 && hrtime<24) ampm="pm";
        return ret+(uppercase ? ampm.toUpperCase() : ampm);
    }


    function fb_about_then(result) {
        var list=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],i;
        console.log("about result="+JSON.stringify(result));
        var texts_str="",hours=result.hours;
        if(hours)
        {
            for(i=0; i < list.length; i++)
            {
                if(!hours[list[i]]) continue;
                texts_str=texts_str+list[i]+" ";
                if(hours[list[i]].closed) texts_str=texts_str+"Closed";
                else { texts_str=texts_str+time24totime12(hours[list[i]].open,false)+"-"+
                    time24totime12(hours[list[i]].close,false); }
                texts_str=texts_str+"\n";
            }
            if(texts_str.length>0) {
                my_query.fields.WritingTexts=texts_str; }
        }
        add_to_sheet();

    }

    function google_response(doc,url,resolve,reject) {
        console.log("In google_response, url="+url);
        var review=doc.getElementById("wrkpb");
        if(review) resolve(review.dataset.pid)
        else resolve("");
    }

    function google_then(result) {
        if(result.length>0) my_query.fields.google_place_id=result;
        add_to_sheet();
    }

    function add_to_sheet() {
        for(var x in my_query.fields) { document.getElementById(x).value=my_query.fields[x]; }
    }

    function parse_wiki_response(response) {
        var url=response.finalUrl,text,i,search;
        console.log("in parse_wiki_response, url="+url);
        text=JSON.parse(response.responseText);
        //console.log("wiki_response="+response.responseText);
        search=text.query.search;
        for(i=0; i < search.length && i < 3; i++)
        {
            my_query.fields["image_url_"+(i+1)]="https://commons.wikimedia.org/wiki/"+search[i].title;
        }
        add_to_sheet();

    }

//
    function init_Query()
    {
        console.log("in init_query");
        var i;
       // var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out")[0].innerText;
        var wiki_url="https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&prop=info&format=json&srsearch=";
        var google_url="https://www.google.com/search?q=";
        var split=dont.split(",");
        my_query={name:split[0].trim(),fields:{city:split[1].trim().replace(/^in\s/,"").trim(),
                                               country:get_country_code(split[2].trim())},
                 full_country:split[2].trim()};
        my_query.short_name=my_query.name.split(" - ")[0];
         my_query.fields.WritingTexts="Monday\nTuesday\nWednesday\nThursday\nFriday\nSaturday\nSunday";
        console.log("my_query="+JSON.stringify(my_query));
        add_to_sheet();

        var google_promise=MTurkScript.prototype.create_promise(google_url+encodeURIComponent(my_query.name+" "+my_query.full_country),
                                                                google_response,google_then);


        var search_str=my_query.name+" "+my_query.full_country+" site:facebook.com",search_str2=my_query.name;
        var trip_str=my_query.name+" "+my_query.full_country+" site:tripadvisor.com";
        
        const queryPromise2 = new Promise((resolve, reject) => {
            console.log("Beginning URL search2 to get stuff from bing");
            query_search(search_str2, resolve, reject, query_response_bing); });
        queryPromise2.then(query_promise_then2).catch(function(val) {
            console.log("Failed at this queryPromise2 " + val); GM_setValue("returnHit",true); });
        const tripPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search tripadvisor");
            query_search(trip_str, resolve, reject, query_response); });
        tripPromise.then(trip_promise_then).catch(function(val) {
            console.log("Failed at this tripPromise " + val); GM_setValue("returnHit",true); });
        GM_xmlhttpRequest({method: 'GET', url: wiki_url+encodeURIComponent(my_query.short_name+" "+my_query.fields.city),
                           onload: function(response) { parse_wiki_response(response); },
                           onerror: function(response) { console.log("Fail"); },
                           ontimeout: function(response) { console.log("Fail"); }
                          });

    }

})();
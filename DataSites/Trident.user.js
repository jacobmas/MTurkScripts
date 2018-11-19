// ==UserScript==
// @name         Trident
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about JJNissen
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://*.allstays.com/*
// @include https://allstays.com/*
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
    var bad_urls=["www.mapquest.com","local.yahoo.com","yelp.com","birdeye.com","findglocal.com",
                 "facebook.com","menupix.com","www.tripadvisor.com","www.zomato.com","foursquare.com","manta.com",
                 "yellowpages.com","whitepages.com","moviefone.com","s3.amazonaws.com","walkscore.com","superpages.com",
                     "bizapedia.com","restaurants.com","city-data.com"];
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

    function check_and_submit()
    {
        document.getElementById("phoneNumber").value=document.getElementById("phoneNumber").value.replace(/^\+1\s*/,"");
        console.log("Checking and submitting");
        if(document.getElementById("addressLine1").value==="undefined" ||
           document.getElementById("city").value==="undefined" ||
           document.getElementById("state").value==="undefined" ||
           document.getElementById("zip").value==="undefined" ||
           document.getElementById("phoneNumber").value==="undefined")
        {
            console.log("Problem");
            GM_setValue("returnHit",true);
            return;
        }

        console.log("Sending");

        if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 500);
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
    function add_to_sheet(address,phone)
    {
        var is_good=false;
        console.log("Adding "+JSON.stringify(address)+" to sheet");
        if(!address) return false;
        phone=phone.replace(/^\s*\(?\+1\)\s*/,"");
        if(address.street===undefined || address.city===undefined || address.state===undefined)
        {
           
        }
        var street="";

        if(address.number!==undefined)
        {
            street=street+address.number+" ";
        }
        if(address.prefix!==undefined) street=street+address.prefix+" ";
        if(address.street!==undefined)        street=street+address.street;
        if(address.type!==undefined) street=street+" "+address.type;
        if(document.getElementById("addressLine1").value.length===0 && street.length>0 &&
          address.city!==undefined && address.state!==undefined && address.zip!==undefined) document.getElementById("addressLine1").value=street;
        if(document.getElementById("city").value.length===0 && address.city!==undefined && address.state!==undefined) document.getElementById("city").value=address.city;
        if(document.getElementById("state").value.length===0 && address.state!==undefined) document.getElementById("state").value=address.state;
        if(document.getElementById("zip").value.length===0 && address.zip!==undefined) document.getElementById("zip").value=address.zip;
        if(document.getElementById("phoneNumber").value.length===0 && phone!==undefined) document.getElementById("phoneNumber").value=phone;
        if(document.getElementById("city").value.length>0 && document.getElementById("state").value.length>0 &&
           document.getElementById("zip").value.length>0 && document.getElementById("phoneNumber").value.length>0 &&
           document.getElementById("addressLine1").value.length>0)
        {
            is_good=true;
        }
        else if(document.getElementById("city").value.length>0 && document.getElementById("state").value.length>0 &&
           document.getElementById("zip").value.length>0 && document.getElementById("phoneNumber").value.length>0)
        {
            if(my_query.doneQuery) {
                document.getElementById("addressLine1").value=my_query.name;
                is_good=true;
            }
        }
        return is_good;
    }
    function parse_canada(to_parse)
    {
        var result={country:"Canada"};
        var canada_zip=/ ([A-Z][\d][A-Z] [\d][A-Z][\d])$/;
        to_parse=to_parse.replace(/(,|\s+)\s*Canada$/,"").trim();
        var the_split;
        if(canada_zip.test(to_parse))
        {
            result.zip=to_parse.match(canada_zip)[0].trim();

        }
        else {
            console.log("Failed zip");
            return result;
        }
        to_parse=to_parse.replace(canada_zip,"").trim();
        if(/[A-Z]{2}$/.test(to_parse))
        {
            result.state=to_parse.match(/[A-Z]{2}$/)[0].trim();
        }
        else { console.log("Failed province");
              return result; }
        to_parse=to_parse.replace(/\s*[A-Z]{2}$/,"").trim();
        to_parse=to_parse.replace(/,\s*$/,"").trim();
        console.log("After province replace, to_parse="+to_parse);
        if(!/,/.test(to_parse))
        {
            result.city=to_parse.trim();
            result.street="";
            return result;
        }

        var city_regex=/,\s*([^,]+)$/;
        if(city_regex.test(to_parse))
        {
            result.city=to_parse.match(city_regex)[1].trim();

        }
        else {
            console.log("Failed city");
            return result;
        }
        to_parse=to_parse.replace(/\s*,?([^,]+)$/,"");
        result.street=to_parse;
        return result;

    }

    function my_parse_address(to_parse)
    {
        var ret_add={};
        var state_re=/([A-Za-z]+) ([\d\-]+)$/;
        var canada_zip=/ ([A-Z]{2}) ([A-Z][\d][A-Z] [\d][A-Z][\d])$/;
       // console.log("In my parseaddess");
        if(/(,|\s+)\s*Canada$/.test(to_parse) || canada_zip.test(to_parse))
        {
         //   console.log("Found canada");
            return parse_canada(to_parse);
        }
        else {
            if(/\s[A-Z]{2}$/.test(to_parse))
            {
                to_parse=to_parse.replace(/([\d]{5})[,\s]+([A-Z]{2})$/,"$2 $1");
                console.log("to_parse="+to_parse);
            }

            return parseAddress.parseLocation(to_parse); }
    }



    function allstays_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in allstays_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption, b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length && i < 2; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
//                var test_re=/http:\/\/www\.rvparkreviews\.com\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+/;
                if(b_name.toLowerCase().indexOf(my_query.first.toLowerCase())!==-1)
                {
                    console.log("resolving on b_url="+b_url);
                    resolve(b_url);
                    return;

                }

            }

           /* if(!found_url)
            {
                document.getElementById("UrlBad").checked=true;
                check_and_submit();
                b1_success=true;
                return;
            }*/

          //GM_setValue("returnHit",true);
            //return;

        }
        catch(error)
        {
	    console.log("Error "+error);
	    GM_setValue("returnHit",true);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        console.log("None found");
        reject("Failed allstays");
        return;

    }

    function allstays_promise_then(url)
    {
        GM_setValue("allstays_result","");
        GM_addValueChangeListener("allstays_result",function() {

            var result=arguments[2];
            console.log("result="+JSON.stringify(result));
            if(result.failed) {
                my_query.doneAllStays=true;
                if(my_query.doneAllStays && my_query.doneQuery && !my_query.submitted)
                {
                    GM_setValue("returnHit",true);
                    return;
                }
                return;
            }

            if(!my_query.submitted)
            {
                if(add_to_sheet(result.address,result.phone) && !my_query.submitted)
                {
                    my_query.submitted=true;
                    check_and_submit();
                    return;
                }
            }
        });
        GM_setValue("allstays_url",url);
    }

    function camp_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in camp_response");
//        for(var i in response) console.log("i="+i+", "+response[i]);
       console.log(response.finalUrl);
        var search;

        var b_algo;
     //   var g_stuff;
        var i;
       // var g1_success=false;
        var b_url="crunchbase.com", b_name;
        var b_top;
        var good_url;
        var lgb_info;
        var b_context;
        var b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var inner_a;
        var name_split;
        var the_address="";
        var the_phone="";
        var b_vList, b_entityTP, cbl;
        var add_success=false, phone_success=false;
        try
        {
            search=doc.getElementById("b_content");
            console.log("search="+search);
         //   b_top=search.getElementById("lgb_info");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");

            if(lgb_info!==null && lgb_info!==undefined)
            {
                console.log("In b_top");
                b_factrow=lgb_info.getElementsByClassName("b_factrow");
                for(i=0; i < b_factrow.length; i++)
                {
                    inner_a=b_factrow[i].getElementsByTagName("a");
                    //console.log("i="+i+", "+inner_a+", "+inner_a.length);
                    console.log("phone_re="+phone_re);
                    if(inner_a!==null && inner_a!==undefined && inner_a.length>0 && inner_a[0].href.indexOf("/maps?")!==-1)
                    {
                        the_address=my_parse_address(inner_a[0].textContent);
                        add_success=true;
                    }
                    else if(phone_re.test(b_factrow[i].innerText))
                    {
                        the_phone=b_factrow[i].innerText;
                        phone_success=true;
                    }
                }
                /* Found in the top part */
                if(add_success && phone_success && !my_query.submitted)
                {
                    if(add_to_sheet(the_address,the_phone) && !my_query.submitted)
                    {
                        my_query.submitted=true;
                        my_query.success=true;
                        my_query.doneQuery=true;

                        check_and_submit();
                        return;
                    }
                }
            }
            else if(b_context!==null && b_context!==undefined)
            {
                console.log("in b_context");
                b_entityTP=b_context.getElementsByClassName("b_entityTP");

                if(b_entityTP!==null && b_entityTP!==undefined && b_entityTP.length>0)
                {
                    b_vList=b_context.getElementsByClassName("b_vList")[0];
                    cbl=b_vList.getElementsByTagName("li");
                    console.log("in b_entityTP");
                    for(i=0; i < cbl.length; i++)
                    {
                        console.log("cbl[i].innerText="+cbl[i].innerText);

                        if(cbl[i].innerText.indexOf("Address:")===0)
                        {
                            the_address=my_parse_address(cbl[i].innerText.substr(9));
                            console.log("the_address="+JSON.stringify(the_address));
                            add_to_sheet(the_address,"");
                            add_success=true;
                        }
                        else if(cbl[i].innerText.indexOf("Phone:")==0)
                        {
                            the_phone=cbl[i].innerText.substr(7);
                            phone_success=true;
                        }
                    }
                    if(add_success && phone_success && !my_query.submitted)
                    {
                        if(add_to_sheet(the_address,the_phone) && !my_query.submitted)
                        {
                            my_query.submitted=true;
                            my_query.success=true;
                            my_query.doneQuery=true;

                            check_and_submit();
                            return;
                        }
                    }
                }

            }
            console.log("Past b_context");

            if(!my_query.tried_once)
            {

                my_query.tried_once=true;
               
                console.log("Trying again");
                camp_search(resolve, reject);
                return;
            }

            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            

            i=0;
            var loc_re=/Location: (.*)\s*Phone: (.*)$/;
            var loc_only_re=/Location: (.*)$/;
            var loc_phone_re=/Phone: (.*)\s*Location: (.*)$/;
            var add_re=/Address: (.*)\s*Phone: ([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/;
            var loc_match;
            for(i=0; i < b_algo.length; i++)
            {
                b_factrow=b_algo[i].getElementsByClassName("b_factrow");
                if(b_factrow!==null && b_factrow!==undefined && b_factrow.length>0)
                {
                    console.log("b_factrow[0].innerText="+b_factrow[0].innerText);
                    loc_match=b_factrow[0].innerText.match(loc_re);
                    console.log("MOO1");
                    if(loc_match!==null && loc_match!==undefined && !my_query.submitted)
                    {
                        if(add_to_sheet(my_parse_address(loc_match[1]),loc_match[2]) && !my_query.submitted)
                        {
                            my_query.submitted=true;


                            check_and_submit();
                            return;
                        }
                    }
                    console.log("Moo2");
                    loc_match=b_factrow[0].innerText.match(loc_phone_re);
                    if(loc_match!==null && loc_match!==undefined && !my_query.submitted)
                    {
                        if(add_to_sheet(my_parse_address(loc_match[2]),loc_match[1]) && !my_query.submitted)
                        {
                            my_query.submitted=true;

                            check_and_submit();
                            return;
                        }
                    }
                    loc_match=b_factrow[0].innerText.match(loc_only_re);
                    if(loc_match!==null && loc_match!==undefined && !my_query.submitted)
                    {
                        console.log("Matched loc_only_re");
                        if(add_to_sheet(my_parse_address(loc_match[1]),"") && !my_query.submitted)
                        {
                            my_query.submitted=true;

                            check_and_submit();
                            return;
                        }
                    }
                }
                else
                {
                    b_caption=b_algo[i].getElementsByClassName("b_caption");
                    if(b_caption!==null && b_caption!==undefined && b_caption.length>0)
                    {
                        loc_match=b_caption[0].innerText.match(add_re);
                        if(loc_match!==null && loc_match!==undefined && !my_query.submitted)
                        {
                            if(add_to_sheet(my_parse_address(loc_match[1].replace(/\.$/,"")),loc_match[2]) && !my_query.submitted)
                            {
                                my_query.submitted=true;

                                check_and_submit();
                                return;
                            }
                        }
                    }
                }


            }
            if(b1_success)
            {
                resolve(JSON.stringify({url: b_url, error:false}));
            }
            else
            {
                console.log("No urls found");
                reject("");
            }
        }
        catch(error)
        {

            console.log("Error "+error);
            reject(JSON.stringify({error: true, errorText: error}));
        }
    }

    function camp_search(resolve,reject) {
        var search_str=my_query.name+" "+ my_query.city+" "+my_query.state;
        if(my_query.tried_once)
        {
            search_str=search_str+" address";
        }
//        if(!first_try) google_search_str=google_search_str+" "+my_query.country;
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             camp_response(response, resolve, reject);
            },
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
        if(!search_result.error && !my_query.submitted)
        {
            my_query.submitted=true;
            console.log("No error");
            /* we got a good result */
            document.getElementById("webpage_url").value=search_result.url;
            check_and_submit();
        }
        else
        {
            if(search_result.noURLS===true && !my_query.submitted)
            {
                my_query.submitted=true;
                console.log("search_result.noURLS="+search_result.noURLS);
                document.getElementsByName("no_page")[0].checked=true;
                check_and_submit();
            }
            else
            {
                /* Didn't get a new URL, quit */
                console.log("Had an error: "+search_result.errorText);
                GM_setValue("returnHit",true);
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
  

    function do_allstays()
    {
        console.log("Doing allstays");
        var result={address:{street:"",city:"",state:"",zip:""}, phone:"",failed:false};
        var add=document.querySelector("[itemprop='address']");
        if(add===null || add===undefined) {
            result.failed=true;
            GM_setValue("allstays_result",result);
            return; }
        var street=document.querySelector("[itemprop='streetAddress']");
        var city=document.querySelector("[itemprop='addressLocality']");
        var state=document.querySelector("[itemprop='addressRegion']");
        var zip=document.querySelector("[itemprop='postalCode']");
        var phone=document.querySelector("[itemprop='telephone']");
        result.address.street=street?street.innerText : "";
        result.address.city=city?city.innerText : "";
        result.address.state=state?state.innerText : "";
        result.address.zip=zip?zip.innerText:"";
        result.phone=phone?phone.innerText:"";
        if(result.address.city.length===0) result.failed=true;

        //console.log("result.list="+JSON.stringify(result.list));
        GM_setValue("allstays_result",result);
    }

    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({ method: 'GET', url:    search_URIBing,onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
        });
    }


    function init_Camp()
    {
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];

        console.log("table.innerText="+wT.innerText+", "+wT.rows.length);
        my_query={name: wT.rows[0].cells[1].innerText, city: wT.rows[1].cells[1].innerText,
                 state: wT.rows[3].cells[1].innerText,submitted:false,doneAllStays:false,doneQuery: false, success:true,try_count:0};
        my_query.tried_once=false;
        my_query.first=my_query.name.split(" ")[0].trim();
       /* if(my_query.company.length==0){
            my_query.company=my_query.fname+" "+my_query.lname+" lawyer";
        }*/


        console.log("my_query="+JSON.stringify(my_query));
        first_try=true;



        var search_str, search_URI, search_URIBing;

        const campPromise = new Promise((resolve, reject) => {
            console.log("Beginning camp search");
            camp_search(resolve, reject);
        });
        campPromise.then(camp_promise_then
        )
        .catch(function(val) {
           console.log("Failed dist " + val);
            my_query.doneQuery=true;
            if(!my_query.success && !my_query.submitted && my_query.doneAllStays && my_query.doneQuery)
            {
                GM_setValue("returnHit",true);
            }
        });
        search_str=my_query.name+" "+my_query.state+" site:allstays.com";
        const allstaysPromise = new Promise((resolve, reject) => {
            console.log("Beginning allstays search");
            query_search(search_str,resolve, reject,allstays_response);
        });
        allstaysPromise.then(allstays_promise_then
        )
        .catch(function(val) {
           console.log("Failed allstays " + val);
            my_query.doneAllStays=true;
            if(!my_query.success && !my_query.submitted && my_query.doneAllStays && my_query.doneQuery)
            {
                GM_setValue("returnHit",true);
            } });






    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") != -1 || window.location.href.indexOf("amazonaws.com") != -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Camp();
        }

    }
    else if(window.location.href.indexOf("allstays.com")!==-1)
    {
        GM_setValue("allstays_url","");
        GM_addValueChangeListener("allstays_url",function() {
            window.location.href=arguments[2];
            /*if(GM_getValue("url").indexOf("allstays.com")!==-1) {
                window.location.href=GM_getValue("url");
            }*/
        });
        setTimeout(do_allstays,500);
    }
    else if(window.location.href.indexOf("mturk.com")!==-1)
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
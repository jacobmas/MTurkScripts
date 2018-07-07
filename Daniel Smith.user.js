// ==UserScript==
// @name         Daniel Smith
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.google.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=false;
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
        console.log("in check");
        if(document.getElementById("webpage_url").value.length>0 && is_bad_url(document.getElementById("webpage_url").value))
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
        if(the_url.indexOf("/pages/")!==-1 || the_url.indexOf("/public/")!==-1 || the_url.indexOf("/events/")!==-1) return true;
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

    function is_bad_img_url(the_url)
    {
        if(the_url.indexOf(".png")===-1 && the_url.indexOf(".jpg")===-1)
        {
            return true;
        }
        return false;
    }

    function facebook_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in facebook_response");

       console.log(response.finalUrl);
        var search;

        var b_algo;
        var i;
    
        var b_url="crunchbase.com", b_name;
      
        var b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var inner_a;
        var name_split;
        var the_address="";
        var the_phone="";
        var b_vList, b_entityTP, cbl;

        var job_text,job_split;
        var add_success=false, phone_success=false;
        var epc;
        try
        {
            search=doc.getElementById("b_content");
           
  
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                reject("Fail");
                return;
            }

            i=0;
           
            for(i=0; i < b_algo.length && i < 6; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;


                if(!is_bad_url(b_url))
                {
                    console.log("original fb url="+b_url);
                    var parsed_url=b_url.replace(/https?:\/\/www\.facebook\.com\//,"").replace(/\/.*$/,"");
                    resolve(JSON.stringify({url: parsed_url}));
                    return;

                }
             


            }
            reject("No good urls found");
            return;
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
GM_setValue("returnHit",true);
            return;
            //console.log("Error "+error);
            //reject(JSON.stringify({error: true, errorText: error}));
        }
        GM_setValue("returnHit",true);
            return;

    }

    function soundcloud_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in soundcloud_response");

       console.log(response.finalUrl);
        var search;

        var b_algo;
        var i;

        var b_url="crunchbase.com", b_name;

        var b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var inner_a;
        var name_split;
        var the_address="";
        var the_phone="";
        var b_vList, b_entityTP, cbl;

        var job_text,job_split;
        var add_success=false, phone_success=false;
        var epc;
        try
        {
            search=doc.getElementById("b_content");


            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                reject("Fail");
                return;
            }

            i=0;

            for(i=0; i < b_algo.length && i < 6; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;


                if(!is_bad_url(b_url))
                {
                    var parsed_url=b_url.replace("https://soundcloud.com/","").replace(/\/.*$/,"");
                    resolve(JSON.stringify({url: parsed_url}));
                    return;

                }



            }
            reject("No good urls found");
            return;
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
GM_setValue("returnHit",true);
            return;
            //console.log("Error "+error);
            //reject(JSON.stringify({error: true, errorText: error}));
        }
        GM_setValue("returnHit",true);
            return;

    }


    function facebook_search(resolve,reject) {
        var search_str=my_query.name+" site:facebook.com";

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
             facebook_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    function soundcloud_search(resolve,reject) {
        var search_str=my_query.name+" site:soundcloud.com";

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
                soundcloud_response(response, resolve, reject);
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
    function facebook_promise_then(to_parse) {

        var search_str, search_URI, search_URIBing;
        var search_result=JSON.parse(to_parse);
        console.log("search_result="+to_parse);
        var name_split;
        my_query.FB=search_result.url;
        my_query.doneFB=true;
        console.log("DoneFB");
        if(my_query.doneFB && my_query.doneSoundCloud && my_query.doneImg)
        {
            console.log("Done with all queries");
            add_to_sheet();
        }
   
    }

    function soundcloud_promise_then(to_parse) {

        var search_str, search_URI, search_URIBing;
        var search_result=JSON.parse(to_parse);
        console.log("search_result="+to_parse);
        my_query.soundCloud=search_result.url;
        my_query.doneSoundCloud=true;
        console.log("Done soundcloud");
        if(my_query.doneFB && my_query.doneSoundCloud && my_query.doneImg)
        {
            console.log("Done with all queries");
            add_to_sheet();
        }
    }
    function add_to_sheet()
    {
        var trans=document.getElementById("TranscriptionTexts");
        trans.value=""+my_query.FB+"\n"+my_query.soundCloud+"\n"+my_query.img_url;
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

    function init_Camp()
    {

       //var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var i;
        var curr_sib;
        var collapse_trigger=document.getElementById("collapseTrigger").innerText;

        var match_collapse=/^(.*) Information Instructions/;
        var my_match=collapse_trigger.match(match_collapse);
        if(my_match===null)
        {
            console.log("Failed to match name thingy; FAIL");
            GM_setValue("returnHit",true);
            return;
        }
        var name=my_match[1];


        my_query={name: name, doneFB: false, doneSoundCloud: false, FB: "NONE", soundCloud: "NONE", doneImg: false, img_url:""};



        var search_str, search_URI, search_URIBing;

        const FBPromise = new Promise((resolve, reject) => {
            console.log("Beginning Facebook search");
            facebook_search(resolve, reject);
        });
        FBPromise.then(facebook_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this Facebook " + val); my_query.doneFB=true; });

        const soundCloudPromise = new Promise((resolve, reject) => {
            console.log("Beginning SoundCloud search");
            soundcloud_search(resolve, reject);
        });
        soundCloudPromise.then(soundcloud_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this soundcloud " + val); my_query.doneSoundCloud=true; });

        GM_setValue("href","");
        GM_addValueChangeListener("href", function() {
            console.log("Got href as " +GM_getValue("href"));
            my_query.img_url=GM_getValue("href");
            my_query.doneImg=true;
            console.log("Done img");
            if(my_query.doneFB && my_query.doneSoundCloud && my_query.doneImg)
        {
            console.log("Done with all queries");
            add_to_sheet();
        }

        });
        GM_setValue("name",name);




    }

    function do_google()
    {
        console.log("Doing google");
        var rg_l=document.getElementsByClassName("rg_l");
        if(rg_l!==null && rg_l!==undefined && rg_l.length>0)
        {
            var i;
            for(i=0; i < rg_l.length; i++)
            {
                var curr_a=rg_l[i];
                var curr_href=curr_a.href;

                console.log("curr_a.href="+curr_href);
                var href_re=/imgurl=(h[^&]*)&/;
                var href_match=curr_href.match(href_re);
                if(href_match!==null)
                {
                    console.log("href_match[1]="+href_match[1]);
                    console.log("decode="+decodeURIComponent(href_match[1]));
                    if(!is_bad_img_url(decodeURIComponent(href_match[1])))
                    {
                        GM_setValue("href",decodeURIComponent(href_match[1]));
                        console.log("Found good, breaking");
                        return;
                    }
                }
            }
            console.log("Found no goods");

        }
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
    else if(window.location.href.indexOf("google.com")!==-1)
    {
        GM_setValue("name","");
        GM_addValueChangeListener("name", function() {
            var new_url="https://www.google.com/search?tbm=isch&q="+encodeURIComponent(GM_getValue("name")+" band");
            window.location.href=new_url;
        });
        setTimeout(do_google, 2000);

    }
    else
    {
       // console.log("In LuisQuintero main");
        if(automate)
        {
            setTimeout(function() { btns_secondary[0].click(); }, 20000); }
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {
                    if(automate) {
                        setTimeout(function() { btns_secondary[0].click(); }, 0); }
                }
            });
         /* Regular window at mturk */
        var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
               btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(automate) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            console.log("MOO");
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();

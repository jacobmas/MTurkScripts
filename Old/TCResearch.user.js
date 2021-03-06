// ==UserScript==
// @name         TCResearch
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about JJNissen
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
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// ==/UserScript==

(function() {
    'use strict';
    var email_re = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];

    var my_query={};

    /* returns the address query string */
    function get_add_query_str(my_query) {
        var basic_str=address_search_queries[my_query.add_query_no];
        basic_str=basic_str.replace("{{my_query.company_name}}",my_query.company_name).replace("{{my_query.streetadd}}",my_query.streetadd);
        return basic_str;
    }
 

    function check_and_submit()
    {


           // setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);

    }
    function is_bad_url(the_url) {
        var bad_urls=["www.helppro.com","www.usmedicaloffice.com","www.superpages.com","local.thefix.com","recoveryrehabs.com","www.alltherapist.com",
                     "npidb.org","healthprovidersdata.com","local.yahoo.com","facebook.com","www.e-physician.info", "www.zoominfo.com",
                     "www.labdraw.com","www.goodtherapy.org","www.wellness.com","/directory/"];
        var i;
        for(i=0; i < bad_urls.length; i++)
            if(the_url.indexOf(bad_urls[i])!==-1)
                return true;
        return false;
    }
        function prefix_in_string(prefixes, to_check)
    {
        var j;
        for(j=0; j < prefixes.length; j++)
            if(to_check.indexOf(prefixes[j])===0) return true;
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
        if(last_pos>=2 && split_parse[1].length>=1)
            ret.mname=split_parse[1].substring(0,1);
        else
            ret.mname="";
        return ret;

    }
    function bing1_response(response,my_query) {

        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log(doc.getElementsByTagName("body")[0]);

        //console.log("response.url="+response.finalUrl);
        var search=doc.getElementById("b_content");

        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="", b_header_search;

        //console.log("b_algo.length="+b_algo.length);
       // var b_algoheader=search.getElementsByClassName("b_algoheader");
        for(i=0; i < b_algo.length; i++)
        {
            b_url=b_algo[i].getElementsByTagName("a")[0].href; // url of query
            if(!is_bad_url(b_url))
            {
                b_header_search=b_algo[i].firstChild.innerText; // basic description
                b1_success=true;
                my_query.url=b_url;
                if(my_query.url.substring(0,4)!=="http")
                {
                    my_query.url="http://"+my_query.url;
                }
                my_query.url=my_query.url.replace(/\/$/,"");
                //GM_openInTab(my_query.url);
                /* Query for individual dude */
                setTimeout(function() {
                    console.log("Querying "+my_query.url);
                    var search_URI=my_query.url;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    search_URI,
                        onload: function(response) {
                            webpage_response(response, my_query); }

                    });
                },10);
                return;
            }
            else
            {
                console.log("i="+i+", bad url "+b_url);
            }
           

        }
        if(b1_success)
        {
            console.log("Found a url successfully");
        }
        else
        {
            /* Do something */
            console.log("Failed in bing1_response");
        }
    }

    function google1_response(response,my_query) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("search");

        var g_stuff=search.getElementsByClassName("g");
        var i;
        var g1_success=false;
        var t_url="", t_header_search="";
        for(i=0; i < g_stuff.length; i++)
        {
            console.log("i="+i+" in Google search.");
            try
            {
                t_url=g_stuff[i].getElementsByTagName("a")[0].href; // url of query
                t_header_search=g_stuff[i].getElementsByClassName("r")[0].innerText; // basic description
                g1_success=true;
                my_query.url=t_url;
                if(my_query.url.substring(0,4)!=="http")
                {
                    my_query.url="http://"+my_query.url;
                }
                my_query.url=my_query.url.replace(/\/$/,"");
                //GM_openInTab(my_query.url);
                /* Query for individual dude */
                setTimeout(function() {
                    console.log("Querying "+my_query.url);
                    var search_URI=my_query.url;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    search_URI,
                        onload: function(response) {
                            webpage_response(response, my_query); }

                    });
                },10);
                if(i>=0)
                    break;
            }
            catch(error)
            {
                console.log("ERROR");
                break;
            }

            //console.log(temp1);
        }
        if(g1_success)
        {
            /* Continue */
            
     


            
        }
        else
        {
            console.log("g1 Fail");
        }
    }
    function webpage_response(response,my_query) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i;
        var contact_href;
        var the_content;
       //console.log(doc.body.innerHTML);
        var email_match=doc.body.innerHTML.match(email_re);
        var raw_url_match=my_query.url.match(/https?:\/\/[^\/]*/);
        var raw_url="";
        if(raw_url_match!==null && raw_url_match.length>0)
        {
            raw_url=raw_url_match[0];
            console.log("raw_url_match[0]="+raw_url_match[0]);
        }
        if(email_match!==null && email_match.length>0)
        {
            document.getElementById("web_url").value=email_match[0];
            //check_and_submit();
            //return;
        }
        //console.log(doc.body.innerHTML);
        for(i=0; i < doc.links.length; i++)
        {
            the_content=doc.links[i].textContent.toLowerCase();
           //console.log("doc.links["+i+"].textContent="+doc.links[i].textContent);
            if(the_content.indexOf("contact")!==-1)
            {
                contact_href=doc.links[i].href;
                if(contact_href.indexOf("https://www.mturkcontent.com")==0)
                {

                    contact_href=contact_href.replace("https://www.mturkcontent.com/dynamic",raw_url).replace("https://www.mturkcontent.com",raw_url);
                    console.log("contact_href="+contact_href);
                }
                 console.log("Found contact "+contact_href);

                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    contact_href,

                    onload: function(response) {

                        check_contacts(response, my_query); }

                });
                return;
            }
        }
    }

    function check_contacts(response,my_query) {
        console.log("In check_contacts");
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var email_match=doc.body.innerHTML.match(email_re);
       // console.log("doc.body.innerHTML="+doc.body.innerHTML);
        if(email_match!==null && email_match.length>0)
        {
            document.getElementById("web_url").value=email_match[0];
            check_and_submit();
            return;
        }
        else
        {
            console.log("No emails found");
        }
    }


    function init_TCResearch()
    {
        var workTable=document.getElementById("workContent").getElementsByTagName("table")[0];

        var name,fname, lname, email, domain, place="";
        var city_field;
        var atpos;
        var name_split;
        var name_ret;
        name=workTable.rows[0].cells[1].innerText;
        name=name.replace(/ lcsw/i,"");
        name_ret=parse_name(name);
        var llc_re=/LLC/;
        fname=name_ret.fname;
        lname=name_ret.lname;
        city_field=workTable.rows[2].cells[1].innerText;
        if(city_field.length>0)
        {
            place=city_field.split(",")[0];
        }
        
      

       my_query = {fname: fname, lname: lname, place: place, state: workTable.rows[3].cells[1].innerText, attempt: 0};

        var match_re=/ [a-z]+/;
        var my_match=name.match(match_re);
        var is_other=(my_match !== null);
        var search_str="";
        if(name.indexOf("LLC")!==-1 || is_other || name.toLowerCase().indexOf("therapeutic ")!==-1  ||
           name.toLowerCase().indexOf(" therapeutic")!==-1 || name.toLowerCase().indexOf("counsel")!==-1)
        {
            search_str=search_str+name+" "+place;
        }
        else
        {
            search_str=search_str+name_ret.fname+" "+name_ret.lname;
        }
        search_str=search_str+" "+place+" therapist -site:psychologytoday.com -site:healthgrades.com -site:networktherapy.com -site:linkedin.com -site:yellowpages.com -site:npino.com -site:findatherapist.com";

        // Put into one object/map thing



        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);

        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        console.log(search_URI);

        console.log(search_URIBing);

        GM_setClipboard(search_URI);

       

        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {

                bing1_response(response, my_query);
            }

        });

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
          
            init_TCResearch();
        }

    }
    else
    {
       // setTimeout(function() { btns_secondary[0].click(); }, 40000);
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {

                //   btns_secondary[0].click();
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
         // btns_primary[0].click();
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
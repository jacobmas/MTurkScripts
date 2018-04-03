// ==UserScript==
// @name         Nolan Fox
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about Nolan Fox
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include file://*
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @connect google.com
// @connect bing.com
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// ==/UserScript==

(function() {
    'use strict';

    var country_suffixes=['au','br','ca','es','fr','in','il','uk'];
    function has_marketer(header, slp)
    {
        if(header.indexOf("marketing") !== -1 || slp.indexOf("marketing") !== -1)
        {
            return true;
        }
        return false;
    }
    function bing1_response(response,data) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("b_content");

        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="", b_header_search;
        var my_match;
        for(i=0; i < b_algo.length; i++)
        {
            b_url=b_algo[i].getElementsByTagName("cite")[0].innerText; // url of query
            b_header_search=b_algo[i].firstChild.firstChild.innerText; // basic description
            my_match=b_url.match(/https:\/\/.*linkedin\.com\/in\//);

            if(my_match !== null && my_match.length>0)
            {
                b1_success=true;
                break;
            }

        }
        if(b1_success)
        {
            document.getElementById("web_url").value=b_url;
            var header_split=b_header_search.split(/( - )|(\|)|(,)/g);
            var marketer_name="";
            if(header_split!==null && header_split.length>0)
            {
                marketer_name=header_split[0].trim();


                document.getElementById("marketer_name").value=marketer_name;
                var name_split=marketer_name.split(" ");

                if(name_split.length>=2) {
                    var fname="", lname="";
                    fname=name_split[0];
                    if(name_split[name_split.length-1]!=='Jr.' && name_split[name_split.length-1]!=='III')
                        lname=name_split[name_split.length-1];
                    else
                        lname=name_split[name_split.length-2];
                    data.fname=fname.toLowerCase();
                    data.lname=lname.toLowerCase();
                    var search_str=data.orgname+" company";//+my_query.streetadd;//


                    var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
                    var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";

                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    search_URI,

                        onload: function(response) {
                            console.log("Beginning Bing3\nURI="+search_URI);
                            //google3_response(response, my_query);
                            domain_response(response, data);
                        }

                    });
                }
            }
        }
    }


    /* Get the marketer linkedin */
    function google1_response(response,data) {
        //console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("search");

        var g_stuff=search.getElementsByClassName("g");
        var i;
        var my_match;
        var g1_success=false;
        var t_url="", t_header_search="", t_slp;
        for(i=0; i < g_stuff.length; i++)
        {
            t_url=g_stuff[i].getElementsByTagName("cite")[0].innerText; // url of query
            t_header_search=g_stuff[i].getElementsByClassName("r")[0].innerText; // basic description
            t_slp=g_stuff[i].getElementsByClassName("slp");



            my_match=t_url.match(/https:\/\/.*linkedin\.com\/in\//);

            if(my_match !== null && my_match.length>0)
            {


                var t_slp_str="";
                if(t_slp !== undefined && t_slp.length>0)
                {
                    t_slp_str=t_slp[0].innerText;
                }
                if(has_marketer(t_header_search.toLowerCase(), t_slp_str.toLowerCase()))
                {
                    g1_success=true;
                    break;
                }
                else
                {
                    g1_success=true;
                    break;
                }
            }
            //console.log(temp1);
        }
        if(g1_success)
        {
            document.getElementById("web_url").value=t_url;
            var header_split=t_header_search.split(/( - )|(\|)|(,)/g);
            var marketer_name="";
            if(header_split!==null && header_split.length>0)
            {
                marketer_name=header_split[0].trim();


                document.getElementById("marketer_name").value=marketer_name;
                var name_split=marketer_name.split(" ");

                if(name_split.length>=2) {
                    var fname="", lname="";
                    fname=name_split[0];
                    if(name_split[name_split.length-1]!=='Jr.' && name_split[name_split.length-1]!=='III')
                        lname=name_split[name_split.length-1];
                    else
                        lname=name_split[name_split.length-2];
                    data.fname=fname;
                    data.lname=lname;
                    var search_str=data.orgname+" company";// + "OR " + data.orgname;//+my_query.streetadd;//


                    var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";

                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    search_URI,

                        onload: function(response) {
                            console.log("Beginning Bing3\nURI="+search_URI);
                            //google3_response(response, my_query);
                            domain_response(response, data);
                        }

                    });
                }
            }
        }
    }



    function parse_domain(t_url)
    {
        var new_url=t_url.replace(/^https:\/\//,"").replace(/^www\./,"").replace(/\/.*$/,"");
        new_url=new_url.replace(/ ›.*$/,"");
        var split_dots=new_url.split(".");
        var split_len=split_dots.length;
        var ret="";
        if(split_len>=3&&country_suffixes.includes(split_dots[split_len-1]))
        {
            ret=split_dots[split_len-3]+"."+split_dots[split_len-2]+"."+split_dots[split_len-1];
        }
        else
        {
            ret=split_dots[split_len-2]+"."+split_dots[split_len-1];
        }
        return ret;
    /*    var x_match=new_url.match(/\./g);
        while(x_match!== null && x_match.length>=2)
        {
            new_url=new_url.replace(/^[^\.]*\./,"");
            x_match=new_url.match(/\./g);
        }*/
    }

    function domain_response(response, data) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("search");

        var g_stuff=search.getElementsByClassName("g");
        var i;
        var g1_success=false;
        var t_url="crunchbase.com", t_header_search="";
        i=0;
        while(t_url.indexOf("crunchbase.com") !== -1 || t_url.indexOf("linkedin.com") !== -1 ||
              t_url.indexOf("bloomberg.com") !== -1 || t_url.indexOf("wikipedia.org") !== -1 ||
              t_url.indexOf("facebook.com") !== -1 || t_url.indexOf("glassdoor.com") !== -1 ||
             t_url.indexOf("pitchbook.com") !== -1 || t_url.indexOf("fortune.com") !== -1
             )
              {
            t_url=g_stuff[i].getElementsByTagName("cite")[0].innerText; // url of query
            i++;
        }
        var new_url=parse_domain(t_url);
        if(new_url!==null && new_url.length>0) {
            data.domain_name=new_url;
            console.log(data.domain_name);
            var search_str="";
            var fname=data.fname, lname=data.lname;
            search_str=search_str+"\""+fname+"."+lname+"@"+data.domain_name+"\"";
            search_str=search_str+" OR \""+fname.substr(0,1)+lname+"@"+data.domain_name+"\"";
            search_str=search_str+" OR \""+fname+"@"+data.domain_name+"\"";
            search_str=search_str+" OR \""+fname+lname+"@"+data.domain_name+"\"";


            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
            GM_setClipboard(search_str);
            /*GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {
                    console.log("Beginning Bing3\nURI="+search_URI);
                    //google3_response(response, my_query);
                    google3_response(response, data);
                }

            });*/
        }
    }
    function bing_domain_response(response, data) {
        console.log("MOO");
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var search=doc.getElementById("b_content");
        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="crunchbase.com", b_header_search;

        while(b_url.indexOf("crunchbase.com") !== -1 || b_url.indexOf("linkedin.com") !== -1 ||
              b_url.indexOf("bloomberg.com") !== -1 || b_url.indexOf("wikipedia.org") !== -1) {
            b_url=b_algo[i].getElementsByTagName("cite")[0].innerText;
            i++;
            console.log("CHOO");
        }
        console.log("TOO");
        var new_url=b_url.replace(/^https:\/\//,"").replace(/^www\./,"").replace(/\/.*$/,"");
        var x_match=new_url.match(/\./g);
        while(x_match!== null && x_match.length>=2)
        {
            new_url=new_url.replace(/^[^\.]*\./,"");
            x_match=new_url.match(/\./g);
        }
        if(new_url!==null && new_url.length>0) {
            data.domain_name=new_url;
            console.log(data.domain_name);
            var search_str="";
            var fname=data.fname, lname=data.lname;
            search_str=search_str+"\""+fname+"."+lname+"@"+data.domain_name+"\"";
            search_str=search_str+" OR \""+fname.substr(0,1)+lname+"@"+data.domain_name+"\"";
            search_str=search_str+" OR \""+fname+"@"+data.domain_name+"\"";
            search_str=search_str+" OR \""+fname+lname+"@"+data.domain_name+"\"";


            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
            GM_setClipboard(search_str);
            /*GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {
                    console.log("Beginning Bing3\nURI="+search_URI);
                    //google3_response(response, my_query);
                    google3_response(response, data);
                }

            });*/
        }
    }

    /* Do phone and address */
    function google3_response(response,my_query) {

        //console.log(response.responseText);
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var phoneAddress;

        var field_names=doc.getElementsByClassName("w8qArf");
        var result_names=doc.getElementsByClassName("LrzXr");


        var i;
        var added_stuff=0;
        console.log("field_names.length="+field_names.length);
        document.getElementsByName("Country")[0].value="US";
        for(i=0; i < field_names.length; i++) {
            if(field_names[i].firstChild.innerText==="Address")
            {
                /* parse the address of equivalent in result names */
                try
                {
                    var parsed = parseAddress.parseLocation(field_names[i].nextSibling.innerText);
                    document.getElementsByName("City")[0].value=parsed.city;
                    document.getElementsByName("State")[0].value=parsed.state;
                    document.getElementsByName("Zip/Postal Code")[0].value=parsed.zip;

                    added_stuff+=1;
                }
                catch(error)
                {
                    console.log("Error:" + error);
                }
            }
            else if(field_names[i].firstChild.innerText==="Phone")
            {
                document.getElementsByName("Corporate Phone")[0].value=field_names[i].nextSibling.innerText;
                added_stuff+=1;
            }
        }

        var other=doc.getElementsByClassName("Z0lcw");
        if(other!==null && other.length>0)
        {
            console.log(other[0].innerText);
        }
        if(field_names.length>0 && added_stuff>=2)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);

        }
        else {


            var web_url=document.getElementsByName("web_url")[0];
            web_url.nextSibling.nextSibling.nextSibling.nextSibling.innerHTML="Corporate Phone: FAIL1";
            var search_str=my_query.company_name+" " + my_query.streetadd+" address";

            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
          
            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {
                    console.log("Beginning Google4\nURI="+search_URI);
                     google4_response(response, my_query);
                               }

            });
        }

    }

    /* Do phone and address */
  
  
    function init_NolanFox()
    {
        var workTable=document.getElementById("workContent").getElementsByTagName("table")[0];

        var orgname=workTable.rows[1].cells[1].innerText;
        
        


        var search_str=orgname + " marketing site:linkedin.com";




        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str);

        var data={orgname: orgname};
       

        GM_xmlhttpRequest({
            method: 'GET',
            //url:    search_URIBing,
            url:    search_URI,
            onload: function(response) {
                google1_response(response, data);
            //    bing1_response(response, data);

            }

        });

    }


    var submitButton=document.getElementById("submitButton");
    if(!submitButton.disabled)
    {
        
        init_NolanFox();
    }



})();
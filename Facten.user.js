// ==UserScript==
// @name         Facten
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Script to deal with facten
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


// VCF Do something with?
(function() {
    'use strict';

    var automate=true;
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
    var domain_map={"mayoclinic.org": "mayo.edu", "fda.gov": "fda.hhs.gov"};

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
        my_query.submitted=true;
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



    /* Get the marketer linkedin */

    function parse_domain(t_url)
    {
        var new_url=t_url.replace(/\/$/,"").replace(/^https?:\/\//,"").replace(/^www\./,"").replace(/\/.*$/,"");
        new_url=new_url.replace(/ ›.*$/,"");
        console.log("t_url="+t_url+"\nnew_url="+new_url);
        var split_dots=new_url.split(".");
        var split_len=split_dots.length;
        var ret="";
        if(split_len>=3&&country_domains.includes(split_dots[split_len-1]))
        {
            ret=split_dots[split_len-3]+"."+split_dots[split_len-2]+"."+split_dots[split_len-1];
        }
        else
        {
            ret=split_dots[split_len-2]+"."+split_dots[split_len-1];
        }


        if(ret in domain_map)
        {
            ret=domain_map[ret];
        }

        return ret;
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
 


    function company_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in query_response");

       console.log(response.finalUrl);
        var b_algo, i, b_url="crunchbase.com", b_name, search;
        var b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var inner_a;
  
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }
            
            for(i=0; i < b_algo.length && i < 6; i++)
            {
                if(b_algo[i].tagName!=="LI")
                {
                    console.log("b_algo["+i+"].tagName="+b_algo[i].tagName);
                    continue;
                }
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                console.log("b_name="+b_name+"\nb_url="+b_url);

                if(!is_bad_url(b_url))
                {
                    resolve(JSON.stringify({domain: parse_domain(b_url), url: b_url}));
                    return;

                }
                


            }
            

        }
        catch(error)
        {

            //console.log("Error "+error);
            reject("Error is "+ error);
        }
        reject("Could not find a domain");
    }



    function get_domain_only(the_url)
    {
        var httpwww_re=/https?:\/\/www[^\.]*\./;
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
        var split_parse=to_parse.split(" ");
        var last_pos=split_parse.length-1;
        var j;
        var caps_regex=/^[A-Z]+$/;
        var ret={};
        for(last_pos=split_parse.length-1; last_pos>=1; last_pos--)
        {
            if(!prefix_in_string(suffixes,split_parse[last_pos])) break;

        }
        ret.lname=split_parse[last_pos];
        ret.fname=split_parse[0];
        if(last_pos>=2 && split_parse[1].length>=1) {
            ret.mname=split_parse[1].substring(0,1); }
        else {
            ret.mname=""; }
        return ret;

    }

    function company_search(resolve, reject)
    {
        var search_str=my_query.orgname;
        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";;

        GM_xmlhttpRequest({
                    method: 'GET',
            //url:    search_URIBing,
            url:    search_URIBing,
            onload: function(response) {
                company_response(response, resolve, reject);
            //    bing1_response(response, data);

            }

        });

    }

        /* Following the finding the district stuff */
    function company_promise_then(to_parse) {

        var search_str, search_URI, search_URIBing;
        var search_result=JSON.parse(to_parse);
        console.log("search_result="+to_parse);
        my_query.domain=search_result.domain;
        my_query.url=search_result.url; /* In case we parsed domain wrong? */
        my_query.email="";
        my_query.phone="";
        my_query.doneGuessEmail=false;
        my_query.doneParsePage=false;
        my_query.submitted=false;

        const guessEmailPromise=new Promise((resolve, reject) => {
            email_search(resolve, reject);
        })

        .then(guess_email_then)
        .catch(function(val) {
           console.log("Failed at email guess " + val); my_query.doneGuessEmail=true;
            if(my_query.doneParsePage && my_query.doneGuessEmail && my_query.email.length===0 &&!my_query.submitted)
            {
                console.log("Returning");
                GM_setValue("returnHit",true);
                return;
            }
            else if(my_query.doneParsePage && my_query.doneGuessEmail)
            {
                my_query.submitted=true;
                check_and_submit();
                return;
            }

        } );

        var edu=/edu$/;
        if(edu.test(my_query.domain) || my_query.orgname.indexOf("University")!==-1)
        {
            console.log("Found edu");
            const findPagePromise=new Promise((resolve, reject) => {
                page_search(resolve, reject);
            })


            .then(page_then)
            .catch(function(val) {
                console.log("Failed at email guess " + val);
                if(my_query.doneParsePage && my_query.doneGuessEmail && my_query.email.length===0)
                {
                    console.log("Returning");
                    GM_setValue("returnHit",true);
                    return;
                }
                else if(my_query.doneParsePage && my_query.doneGuessEmail)
                {
                my_query.submitted=true;
                check_and_submit();
                return;
                }
            } );
        }
        else
        {
             console.log("not Found edu");
            page_then();
        }


    }

    function page_then()
    {
        my_query.doneParsePage=true;
        console.log("\t\tIn page_then\n\n");
        if(my_query.doneParsePage && my_query.doneGuessEmail)
        {
            if(my_query.email.length>0 && !my_query.submitted)
            {
                my_query.submitted=true;

                check_and_submit();
                return;
            }
            else if(my_query.email.length===0)
            {
                GM_setValue("returnHit",true);
            }

        }
    }

    function guess_email_then(the_message)
    {
        console.log("\t\tIn guess_email_then\n\n");
        my_query.doneGuessEmail=true;
        if(my_query.doneParsePage && my_query.doneGuessEmail)
        {
            if(my_query.email.length>0 && !my_query.submitted)
            {
                my_query.submitted=true;
                check_and_submit();
                return;
            }
            else if(my_query.email.length===0)
            {
                GM_setValue("returnHit",true);
            }

        }
    }

    function email_search(resolve, reject)
    {

        var search_str="";
        var fname=my_query.fname, lname=my_query.lname, mname=my_query.mname;
        search_str=search_str+"\""+fname+"."+lname+"@"+my_query.domain+"\"";
        search_str=search_str+" OR \""+fname.substr(0,1)+lname+"@"+my_query.domain+"\"";
        search_str=search_str+" OR \""+fname+lname+"@"+my_query.domain+"\"";
        search_str=search_str+" OR \""+lname+"."+fname+"@"+my_query.domain+"\"";
        search_str=search_str+" OR \""+fname+"."+mname.substr(0,1)+"."+lname+"@"+my_query.domain+"\"";
        console.log("Email search_str="+search_str);
        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
        GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {
                    console.log("Beginning Google search for emails\nURI="+search_URI);
                    //google3_response(response, my_query);
                    email_response(response, resolve, reject);
                }

            });
    }

       function page_search(resolve, reject)
    {

        var search_str=my_query.fname+" "+my_query.lname+" site:.edu";
        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";;

        GM_xmlhttpRequest({
                    method: 'GET',
            //url:    search_URIBing,
            url:    search_URIBing,
            onload: function(response) {
                page_response(response, resolve, reject);
            //    bing1_response(response, data);

            }

        });
    }

    function email_response(response,resolve, reject) {
        //console.log(JSON.stringify(response));
        console.log("In email response");
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search, g_stuff;
        try
        {
            search=doc.getElementById("search");

            g_stuff=search.getElementsByClassName("g");
        }
        catch(error)
        {
            console.log("Error "+error);
            reject("Failed");
            return;
        }
        var i;
        var my_match;
        var g1_success=false;
        var t_url="", t_header_search="", t_slp, t_st;
        for(i=0; i < g_stuff.length; i++)
        {
            try
            {
                t_url=g_stuff[i].getElementsByTagName("a")[0].href; // url of query
                t_header_search=g_stuff[i].getElementsByClassName("r")[0].innerText; // basic description
                t_slp=g_stuff[i].getElementsByClassName("slp");
                t_st=g_stuff[i].getElementsByClassName("st")[0].innerText;

                console.log("t_st="+t_st);


                my_match=t_st.match(email_re);


                console.log("t_header_search="+t_header_search);

                if(my_match !== null && my_match.length>0)
                {
                    if(my_query.email.length===0)
                    {
                        my_query.email=my_match[0];
                        console.log("Guessed email="+my_match[0]);
                        my_query.doneGuessEmail=true;
                        /* Try to find phone at same site */

                        g1_success=true;
                        break;



                    }
                }
            }
            catch(error)
            {
                console.log("Failed email response"+error);
                 reject("Failed email_response");
                return;
            }

        }
        if(g1_success)
        {
            my_query.good_url=t_url;
            var end_pdf=/\.pdf$/;
            if(!end_pdf.test(t_url))
            {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    t_url,

                    onload:function(response) {
                        console.log("Beginning Google search for emails\nURI="+t_url);
                        //google3_response(response, my_query);
                        parse_faculty_page(response, resolve, reject);
                    }

                });
            }
            else
            {
                add_to_sheet();
            }
        }
        else
        {
            console.log("Failed");
            reject("Failed email_response");

        }
    }

    function page_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));

        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in page_response");

       console.log(response.finalUrl);
        var b_algo, i, b_url="crunchbase.com", b_name, search;
        var b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var inner_a;

        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }

            for(i=0; i < b_algo.length && i < 6; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                console.log("b_name="+b_name+"\nb_url="+b_url);

                if(!is_bad_url(b_url))
                {
                    my_query.good_url=b_url;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    b_url,

                        onload:function(response) {
                            console.log("Parsing faculty page\nURI="+b_url);
                            //google3_response(response, my_query);
                            parse_faculty_page(response, resolve, reject);
                        }


                    });
                    return;
                }



            }


        }
        catch(error)
        {

            //console.log("Error "+error);
            reject("Error is "+ error);
        }
        reject("Could not find a domain");
    }


    function parse_faculty_page(response, resolve, reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var body=doc.body.innerText;
        var email_match=body.match(email_re);
        var phone_match=body.match(phone_re);
        var mailto=body.match("mailto");
        console.log(JSON.stringify(mailto));

        if(email_match!==null && my_query.email.length===0)
        {
            console.log("Found email="+email_match[0]);
            my_query.email=email_match[0];
        }
        if(phone_match!==null && my_query.phone.length===0)
        {
            console.log("Found phone="+phone_match[0]);

            my_query.phone=phone_match[0];
        }
        add_to_sheet();
        if(my_query.email.length>0 && my_query.good_url.length>0 && my_query.phone.length>0 && !my_query.submitted)
        {

            my_query.submitted=true;
            check_and_submit();
        }
        resolve("Done");
    }

    function add_to_sheet()
    {
        document.getElementById("homepage").value=my_query.good_url;
        document.getElementById("email").value=my_query.email;
        document.getElementById("phone").value=my_query.phone;
    }






    function init_Facten()
    {
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var orgname=wT.rows[1].cells[1].innerText;
        var name=wT.rows[0].cells[1].innerText.trim();

        var fullname=parse_name(name);


        my_query={orgname: orgname, name: wT.rows[0].cells[1].innerText.trim(), fname: fullname.fname, mname: fullname.mname, lname: fullname.lname };
       console.log("my_query="+JSON.stringify(my_query));
        const companyPromise = new Promise((resolve, reject) => {
            console.log("Beginning company search");
            company_search(resolve, reject);
        });
        companyPromise.then(company_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this company " + val); my_query.doneCompany=true; });



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

            init_Facten();
        }

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
                        setTimeout(function() { btns_secondary[0].click(); }, 1000); }
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

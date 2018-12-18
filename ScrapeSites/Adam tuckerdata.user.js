// ==UserScript==
// @name         Adam tuckerdata
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script data about site
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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var frame_count=0;
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
        var lower=my_query.fields.companyName.toLowerCase();
        if(b_name.toLowerCase().indexOf(lower)!==-1) return false;

        return true;
    }
    function DeCryptString( s )
    {
        var n = 0;
        var r = "mailto:";
        var z = 0;
        for( var i = 0; i < s.length/2; i++)
        {
            z = s.substr(i*2, 1);
            n = s.charCodeAt( i*2+1 );
            if( n >= 8364 )
            {
                n = 128;
            }
            r += String.fromCharCode( n - z );
        }
        return r;
    }

    function DecryptX( s )
    {
        return DeCryptString( s );
    }

    function cfDecodeEmail(encodedString) {
        var email = "", r = parseInt(encodedString.substr(0, 2), 16), n, i;
        for (n = 2; encodedString.length - n; n += 2){
            i = parseInt(encodedString.substr(n, 2), 16) ^ r;
            email += String.fromCharCode(i);
        }
        return email;
    }


    function check_if_bad(doc,url)
    {
        var title=doc.title;
        if(/403/.test(doc.title) || /404/.test(doc.title) || url.indexOf("/error/")!==-1)
        {
            document.getElementById("feedback").value="Site won't load";
            return true;
        }

        else if(url.indexOf("suspendedpage.cgi")!==-1 || url.indexOf("defaultwebpage.cgi")!==-1)
        {
            document.getElementById("feedback").value="Page suspended";
            return true;
        }
        else if(/Hugedomains\.com/.test(doc.title))
        {
            document.getElementById("feedback").value="Page for sale";
            return true;
        }
        else if(/Windows Server/.test(doc.title))
        {
            document.getElementById("feedback").value="Site not configured";
            return true;
        }
        else if(doc.body.innerHTML.length<=10)
        {
            document.getElementById("feedback").value="Blank page";
            return true;
        }
        console.log("doc.body.innerHTML.length="+doc.body.innerHTML.length);
        console.log("doc.title="+doc.title+", url="+url);


        return false;
    }
    function get_links(doc)
    {
        var i,j;
        var links=doc.links;
        var curr_href;
        for(i=0; i < links.length; i++)
        {
            curr_href=links[i].href;
            if(curr_href.indexOf("linkedin.com/")!==-1) my_query.fields.companyLinkedin=curr_href;
            else if(curr_href.indexOf("facebook.com")!==-1) my_query.fields.companyFacebook=curr_href;
            else if(curr_href.indexOf("twitter.com/")!==-1) my_query.fields.companyTwitter=curr_href;
            else if(curr_href.indexOf("instagram.com/")!==-1) my_query.fields.companyInstagram=curr_href;
            else if(curr_href.indexOf("youtube.com/")!==-1) my_query.fields.companyYoutube=curr_href;
            else if(/tel:/.test(curr_href))
            {
                var tel_match=curr_href.match(/tel:(.*)$/);
                my_query.fields.companyPhone=tel_match[1];
            }
            if(/^Contact/i.test(links[i].innerText)) {
                do_page(links[i].href, contact_response);
            }
        }
    }
    function do_page(url, callback)
    {
        GM_xmlhttpRequest({
            method: 'GET',

            url:    url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             callback(response);
            },
            onerror: function(response) { console.log("Fail at "+url+"\t"+JSON.stringify(response));
                                         },
            ontimeout: function(response) { console.log("Fail at "+url+"\t"+JSON.stringify(response)); }


            });
    }
    function is_bad_email(to_check)
    {
        if(to_check.indexOf("@2x.png")!==-1 || to_check.indexOf("@2x.jpg")!==-1) return true;
        else if(to_check.indexOf("s3.amazonaws.com")!==-1) return true;
        return false;
    }

    function add_location_address(to_add)
    {
        var state_match;
        to_add=to_add.replace(/Victoria (\d{4})/,"VIC $1")
        .replace(/^.*:/,"").replace(/\(\d{2}\)\s*\d{4}(.*([A-Z]{2,3})\s+(\d{4}))$/,"$1")
            .trim();
        console.log("to_add="+to_add);
        var temp_str=to_add.trim().replace(/[\n\r]+/g,",").replace(/[\t]+/g,"").trim().replace(/,? Australia$/,"");
        var state_post_regex=/([A-Z]{2,3})\s+(\d{4})$/;


        state_match=temp_str.match(state_post_regex);

        if(state_match!==null)
        {
            my_query.fields.addressState=state_match[1];
            my_query.fields.postcode=state_match[2];
        }
          if(temp_str.indexOf(" Australia"===-1)) temp_str=temp_str+" Australia";
        my_query.fields.addressFull=temp_str;
        add_to_sheet();
    }
    function add_location_address_mailing(to_add)
    {
        var state_match;
        to_add=to_add.replace(/Victoria (\d{4})/,"VIC $1")
        .replace(/^.*:/,"").trim();
        console.log("to_add="+to_add);
        var temp_str=to_add.trim().replace(/[\n\r]+/g,",").replace(/[\t]+/g,"").trim().replace(/,? Australia$/,"");
        var state_post_regex=/([A-Z]{2,3})\s+(\d{4})$/;


        state_match=temp_str.match(state_post_regex);

        if(state_match!==null)
        {
            my_query.fields.addressMailingState=state_match[1];
            my_query.fields.addressMailingPostcode=state_match[2];
        }
          if(temp_str.indexOf(" Australia"===-1)) temp_str=temp_str+" Australia";
        my_query.fields.addressMailing=temp_str;
        add_to_sheet();
    }


    function create_promise(search_str,callback)
    {
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for "+search_str);
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(callback)
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        return queryPromise;

    }
    function search_name(name)
    {
        var promise_list=[];
        var query_list=["linkedin.com","facebook.com","twitter.com","instagram.com","youtube.com"];
        var i;
        var url="https://abr.business.gov.au/Search/ResultsActive?SearchText="+encodeURIComponent(name);
        GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { parse_abr(response); },
            onerror: function(response) { console.log("Failed abr"); },
            ontimeout: function(response) { console.log("Failed abr"); }
            });
        for(i=0; i < query_list.length; i++)
        {
            promise_list.push(create_promise(name+" site:"+query_list[i], promise_then));
        }
    }

    function promise_then(url)
    {
        console.log("promise_then: url="+url);
        if(/linkedin\.com/.test(url) && my_query.fields.companyLinkedin===undefined ) my_query.fields.companyLinkedin=url;
        if(/facebook\.com/.test(url) && my_query.fields.companyFacebook===undefined) my_query.fields.companyFacebook=url;
        if(/twitter\.com/.test(url)&& my_query.fields.companyTwitter===undefined ) my_query.fields.companyTwitter=url;
        if(/instagram\.com/.test(url)&& my_query.fields.companyInstagram===undefined) my_query.fields.companyInstagram=url;
        if(/youtube\.com/.test(url)&& my_query.fields.companyYoutube===undefined) my_query.fields.companyYoutube=url;

        add_to_sheet();

    }

    function parse_abr(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var content=doc.getElementById("content-matching");
        console.log("*** in parse_abr");
        var i;
        var table,curr_row;
        var lower_name=my_query.fields.companyName.toLowerCase();
        try
        {
            table=content.getElementsByTagName("table")[0];
            for(i=1; i < table.rows.length; i++)
            {
                curr_row=table.rows[i];
                console.log("abr: ("+i+"), "+curr_row.cells[0].getElementsByTagName("a")[0].innerText+", "+
                            curr_row.cells[1].innerText.trim());
                if(curr_row.cells[1].innerText.trim().toLowerCase().indexOf(lower_name)!==-1 ||
                  lower_name.indexOf(curr_row.cells[1].innerText.trim().toLowerCase())!==-1)
                {
                    my_query.fields.companyABN=curr_row.cells[0].getElementsByTagName("a")[0].innerText.trim();
                    console.log("matched "+i);
                    break;
                }
//                else

            }

        }
        catch(error) { console.log("Error in parsing abr "+error); }
        add_to_sheet();


    }

    function get_address(doc)
    {
        var inner_p=doc.getElementsByTagName("p");
        var state_post_regex=/([A-Z]{2,3})\s+(\d{4})$/;
        var phone_re=/(?:Tel|P(?:h(?:one)?)?)[:\.]?([\(\)\d\+\s]+)/;
        var phone_re2=/P.\s*([\(\)\d\+\s]+)/;
        var name_re=/©\s*\d{4}\s*([A-Za-z\s]+)/;
        var phone_match;
        var address=doc.getElementsByTagName("address");
         var add_re1=/Head Office:\s*(.*[A-Z]{2,4} \d{4})/;
        if(address.length>0)
        {
            add_location_address(address[0].innerText);
        }
        var i;

        for(i=0; i < inner_p.length; i++)
        {

            console.log("inner_p["+i+"]="+inner_p[i].innerText);
            if(name_re.test(inner_p[i]))
            {
                my_query.fields.companyName=inner_p[i].match(name_re)[1];
                if(!my_query.searchedName)
                {
                    my_query.searchedName=true;
                    search_name(my_query.fields.companyName);
                }
                add_to_sheet();
//                document.getElementById("companyName").value=my_query.companyName;
            }
            if(inner_p[i].innerText.match(state_post_regex)!==null)
            {
                console.log("Matched state_post_regex");
                if(inner_p[i].innerText.indexOf("PO")===-1)
                {
                    add_location_address(inner_p[i].innerText);
                }
            }
            else if(inner_p[i].innerText.match(add_re1)!==null)
            {
                add_location_address(inner_p[i].innerText.match(add_re1)[1]);
            }
            if((phone_match=inner_p[i].innerText.match(phone_re))!==null)
            {
                my_query.fields.companyPhone=phone_match[1];

            }
          /*  else if((phone_match=inner_p[i].innerText.match(phone_re2))!==null)
            {
                my_query.fields.companyPhone=phone_match[1];
            }*/
        }
          inner_p=doc.getElementsByTagName("div");
        for(i=0; i < inner_p.length; i++)
        {
              if(inner_p[i].getElementsByTagName("div").length>0) continue;
            console.log("inner_p["+i+"]="+inner_p[i].innerText);
            if(name_re.test(inner_p[i]))
            {
                my_query.fields.companyName=inner_p[i].match(name_re)[1];
                if(!my_query.searchedName)
                {
                    my_query.searchedName=true;
                    search_name(my_query.fields.companyName);
                }
                add_to_sheet();
//                document.getElementById("companyName").value=my_query.companyName;
            }
            if(inner_p[i].innerText.match(state_post_regex)!==null)
            {
                console.log("Matched state_post_regex");
                if(inner_p[i].innerText.indexOf("PO")===-1)
                {
                    add_location_address(inner_p[i].innerText);
                }
            }
            else if(inner_p[i].innerText.match(add_re1)!==null)
            {
                add_location_address(inner_p[i].innerText.match(add_re1)[1]);
            }
            if((phone_match=inner_p[i].innerText.match(phone_re))!==null)
            {
                my_query.fields.companyPhone=phone_match[1];

            }
          /*  else if((phone_match=inner_p[i].innerText.match(phone_re2))!==null)
            {
                my_query.fields.companyPhone=phone_match[1];
            }*/
        }
        var contdetails=doc.getElementsByClassName("contact-details");
        if(contdetails.length>0 && contdetails[0].tagName==="UL")
        {
            parse_contact_details(contdetails[0]);
        }
        add_to_sheet();
    }
    function parse_contact_details(details)
    {
        /* Get list elements */
        var state_post_regex=/([A-Z]{2,3})\s+(\d{4})/;
        var state_match;
        var li=details.getElementsByTagName("li");
        var i;
        var temp_str;
        for(i=0; i < li.length; i++)
        {
            if(li[i].getElementsByClassName("icon-location").length>0)
            {
                temp_str=li[i].innerText.replace(/[\n\r]+/g,",");
                if(temp_str.indexOf(" Australia"===-1)) temp_str=temp_str+" Australia";
                my_query.fields.addressFull=temp_str;
                state_match=temp_str.match(state_post_regex);
                if(state_match!==null)
                {
                    my_query.fields.addressState=state_match[1];
                    my_query.fields.postcode=state_match[2];
                }
            }
            if(li[i].getElementsByClassName("icon-mail").length>0)
            {
                temp_str=li[i].innerText.replace(/[\n\r]+/g,",");
                if(temp_str.indexOf(" Australia"===-1)) temp_str=temp_str+" Australia";
                my_query.fields.addressMailing=temp_str;
                state_match=temp_str.match(state_post_regex);
                if(state_match!==null)
                {
                    my_query.fields.addressMailingState=state_match[1];
                    my_query.fields.addressMailingPostcode=state_match[2];
                }
            }

        }
    }

    function contact_response(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j;
        var email_val;
        var my_match;
        var foundInsta=false, foundFB=false;

        let curr_phone_re=/\(\d{2}\) \d{4} \d{4}/;

        console.log("in contact response "+response.finalUrl);
        var short_name=response.finalUrl.replace(my_query.url,"");//.replace(/[\/]+/g,"");
        var links=doc.links;
        var email_matches=doc.body.innerText.match(email_re);
        var phone_matches=doc.body.innerText.match(phone_re);
        get_address(doc);


        if(email_matches!==null)
        {
            j=0;
            for(j=0; j < email_matches.length; j++)
            {
                if(!is_bad_email(email_matches[j]) && email_matches[j].length>0) {

                    my_query.email=email_matches[j];
                    my_query.fields.companyEmail=my_query.email;
                    break;
                }
            }


            console.log("Found email hop="+my_query.email);
        }

        if(phone_matches!==null)
        {
            j=0;
            for(j=0; j < phone_matches.length; j++)
            {
                my_query.fields.companyPhone=phone_matches[j];
                add_to_sheet();
                break;

            }


            console.log("Found phone hop="+my_query.fields.companyPhone);
        }


        for(i=0; i < links.length; i++)
        {
            if(/tel:/.test(links[i].href))
            {
                var tel_match=links[i].href.match(/tel:(.*)$/);
                my_query.fields.companyPhone=tel_match[1];
                console.log("matched tel "+my_query.fields.companyPhone);
            }
            if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
            {
            //    console.log(short_name+": ("+i+")="+links[i].href);
            }
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1)
            {
                var encoded_match=links[i].href.match(/#(.*)$/);
                if(encoded_match!==null)
                {
                    email_val=cfDecodeEmail(encoded_match[1]);
                    console.log("DECODED "+email_val);
                    my_query.email=email_val.replace(/\?.*$/,"");
                    my_query.fields.companyEmail=my_query.email;
                    my_query.doneEmail=true;
                }
            }
            if(email_re.test(links[i].href.replace(/^mailto:\s*/,"")))
            {
                email_val=links[i].href.replace(/^mailto:\s*/,"").match(email_re);
                console.log("Found emailBlop="+email_val);

                if(email_val.length>0 && !is_bad_email(email_val))
                {
                    console.log("set email");
                    my_query.email=email_val;
                    my_query.fields.companyEmail=my_query.email;
                }

            }
            if(links[i].href.indexOf("javascript:location.href")!==-1)
            {
                my_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/);
                console.log("my_match="+JSON.stringify(my_match));
                var match_split=my_match[1].split(",");
                email_val="";
                for(j=0; j < match_split.length; j++)
                {
                    email_val=email_val+String.fromCharCode(match_split[j].trim());
                }
                //email_val=String.fromCharCode(my_match[1]);
                console.log("new email_val="+email_val);
                my_query.email=email_val;
                my_query.fields.companyEmail=my_query.email;
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1)
            {
                my_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/);
                console.log("my_match="+JSON.stringify(my_match));
                email_val=DecryptX(my_match[1]);
                console.log("new email_val="+email_val);
            }

            //='mailto:'+String.fromCharCode(

        }
        add_to_sheet();
        //add_and_submit();


    }


    function parse_finance(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        my_query.finance_url=response.finalUrl;
        var frame=doc.getElementsByTagName("frame");
        if(frame.length>0 && frame_count===0)
        {
            frame_count++;
            GM_xmlhttpRequest({
                method: 'GET',
                timeout:15000,
                url:    frame[0].src,

                onload: function(response) {
                    //   console.log("On load in crunch_response");
                    //    crunch_response(response, resolve, reject);
                    console.log("Parsing finance again");
                    parse_finance(response);
                },
                onerror: function(response) { console.log("Fail initially");
                                             document.getElementById("feedback").value="Site won't load";
                                             check_and_submit(check_function,automate); },
                ontimeout: function(response) { console.log("Fail"); document.getElementById("feedback").value="Site won't load";
                                               check_and_submit(check_function,automate); }


            });
            return;
        }
        if(check_if_bad(doc,response.finalUrl)) { check_and_submit(check_function,automate); return; }
        get_links(doc);


        var doc2;
        my_query.url=response.finalUrl;
        var begin_url=my_query.url.replace(/(https?:\/\/[^\/]+)\/?.*$/,"$1");
        my_query.begin_url=begin_url;
        var i,j;
        var footer=doc.getElementById("footer");
        var footertag=doc.getElementsByTagName("footer");
        var links=doc.links;
        var inner_p;
        var success=false;
        if(footer!==null)
        {

            if(footer.innerText.indexOf("Powered by YTML Canvas")!==-1) { console.log("Found YTML canvas"); parse_ytml(doc); return; }
            else {
                success=false;
                console.log("Found footer");
                search_p(footer.getElementsByTagName("p"));
            }
        }
        if(footertag.length>0)
        {
            console.log("Found footer tag");
            search_p(footertag[0].getElementsByTagName("p"));
            search_p(footertag[0].getElementsByTagName("div"));

        }
        search_p(doc.getElementsByTagName("p"));
        add_to_sheet();
        //  var new_url2=links[i].href.replace(/https?:\/\/[^\/]+\//,my_query.begin_url+"/");
       
     
        
        


    }

    function add_to_sheet()
    {
        var x;
        console.log("Adding to sheet "+JSON.stringify(my_query.fields));
        for(x in my_query.fields)
        {

            document.getElementById(x).value=my_query.fields[x];
        }
    }
    /* Search paragraphs for ABN stuff */
    function search_p(inner_p)
    {
        var i;
        let phone_re=/\(?\d{2}\)?\s*\d{4}\s*\d{4}/;
        var name_re=/(?:©|Copyright\s*:?)\s*(?:\d{4})?\s*([A-Za-z ]+)/;

         for(i=0; i < inner_p.length; i++) {

             if(name_re.test(inner_p[i].innerText))
             {
                 my_query.fields.companyName=inner_p[i].innerText.match(name_re)[1].replace(/All Rights .*$/i,"").trim();
                 if(!my_query.searchedName)
                {
                    my_query.searchedName=true;
                    search_name(my_query.fields.companyName);
                }
                 add_to_sheet();
             }

             if(phone_re.test(inner_p[i].innerText))
             {
                 my_query.fields.companyPhone=inner_p[i].innerText.match(phone_re)[0].trim();
                 console.log("Matched phone in search_p");
                 add_to_sheet();
             }
            console.log("inner_p (or div)["+i+"]="+inner_p[i].innerText);
            parse_abn_stuff(inner_p[i].innerText);

         }
    }

 

  

   

    function parse_abn_stuff(text)
    {
      //  text=text.replace(/^[\"\']+/g,"").replace(/^[^:]{2,20}:/,"").replace(/^\s*/,"");
        //text=text.replace(/^Copyright ©[\s\d]*/i,"");
        console.log("text="+text);
        var abn_re=/^([^\(]{2,50}?)\(?\s*A(?:\.)?B(?:\.)?N(?:\.)?\s*([\d\s]*)/;//{2}\s*[\d]{3})/;//\s*[\d]{3}\s*[\d]{3})/;
        var abn2_re=/Authorised Representative.*\sof\s(.*?) ABN ([\d]{2}\s*[\d]{3}\s*[\d]{3}\s*\d{3})/i;
        var abn3_re=/Authorised Representative.*\sof\s([^\n\.\(]*)/;
        var abn4_re=/A(?:\.)?B(?:\.)?N(?:\.)?\s*([\d\s]*)/;
        var afsl_re=/(?:Australian Financial Services|AFSL)[^\d]*([\d\s]+)/;
        var abn_match,abn2_match,afsl_match,abn3_match,abn4_match;
        abn_match=text.match(abn_re);
        abn2_match=text.match(abn2_re);
        abn3_match=text.match(abn3_re);
        abn4_match=text.match(abn4_re);
        afsl_match=text.match(afsl_re);

        if(abn_match!==null)// && abn_match[1].length<100)
        {
            my_query.fields.companyName=abn_match[1];
            if(!my_query.searchedName)
            {
                my_query.searchedName=true;
                search_name(my_query.fields.companyName);
            }
            my_query.fields.companyABN=abn_match[2];
        }
        else if(abn4_match)
        {
            my_query.fields.companyABN=abn4_match[1];
        }
        if(afsl_match!==null)
        {
            console.log("Matched afsl");
            my_query.fields.AFSLNumber=afsl_match[1];
        }
    }
 
 


    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");


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



                if(!is_bad_name(b_name))
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
   


    function abn_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        console.log("Doing abn_paste, text.indexOf(\" \")="+text.indexOf(" ")+"\ttext.length="+text.length);
        if(text.indexOf(" ")===-1 && text.length===11)
        {
            text=text.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/,"$1 $2 $3 $4");
        }
        e.target.value=text;
    }

    function addressfull_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        add_location_address(text);
    }

    function addressmailing_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        add_location_address_mailing(text);
    }

    function name_paste(e)
    {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        my_query.fields.companyName=text;
        add_to_sheet();
        search_name(text);
    }


    function init_Query()
    {
        var rows=document.getElementsByClassName("row");
        var dont=document.getElementsByClassName("dont-break-out")[0].href;
        if(dont.indexOf("barbican.com.au")!==-1) dont="http://www.barbican.amp.com.au/";
      

    //   var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        document.getElementById("companyABN").addEventListener("paste",abn_paste);
         document.getElementById("addressFull").addEventListener("paste",addressfull_paste);
        document.getElementById("addressMailing").addEventListener("paste",addressmailing_paste);
        document.getElementById("companyName").addEventListener("paste",name_paste);

        my_query={url:dont,fields:{},searchedName:false};

       // document.getElementById("companyABN").addEventListener("paste",abn_paste);
//        document.getElementById("AFSLABN").addEventListener("paste",abn_paste);

        GM_xmlhttpRequest({
            method: 'GET',
            timeout:15000,
            url:    my_query.url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             parse_finance(response);
                contact_response(response);
            },
            onerror: function(response) { console.log("Fail initially");
                                         document.getElementById("feedback").value="Site won't load";
                                             check_and_submit(check_function,automate); },
            ontimeout: function(response) { console.log("Fail"); document.getElementById("feedback").value="Site won't load";
                                             check_and_submit(check_function,automate); }


            });

        GM_xmlhttpRequest({
            method: 'GET',
            timeout:15000,
            url:    my_query.url.replace(/\/?$/,"/contact-us/"),

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
           //  parse_finance(response);
                contact_response(response);
            },
            onerror: function(response) { console.log("Fail initially");
                                         document.getElementById("feedback").value="Site won't load";
                                             check_and_submit(check_function,automate); },
            ontimeout: function(response) { console.log("Fail"); document.getElementById("feedback").value="Site won't load";
                                             check_and_submit(check_function,automate); }


            });




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
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
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
          /*  setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 20000);*/
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
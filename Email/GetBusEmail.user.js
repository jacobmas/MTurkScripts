// ==UserScript==
// @name         GetBusEmail
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  GetBusinessEmail originally MonicaDorsey?
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*facebook.com/*
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

    var MTurk=new MTurkScript(20000,0,[],init_Query,"A36BAPYNDDCH4N");

    function check_function()
    {
	return true;
    }

    function is_bad_email(email)
    {
        if(email.indexOf("@example.com")!==-1 || email.indexOf("@email.com")!==-1 || email.indexOf("@domain.com")!==-1) return true;
        return false;
    }

    function check_and_submit(check_function)
    {
        console.log("in check");
        if(check_function!==undefined && !check_function())
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
        if(b_name.toLowerCase().indexOf(my_query.name.toLowerCase().split(" ")[0])===-1) return true;
	return false;
    }

    function get_page(url,  callback,extension)
    {
        console.log("in get_page");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
                console.log("found page");
             callback(response,extension);
            },
            onerror: function(response) { console.log("Page \'"+url+"\' not found");
                                         my_query.doneQueries++;
                                         submit_if_done();
            },
            ontimeout: function(response) { console.log("Page \'"+url+"\' timed out");

                                           my_query.doneQueries++;
                                         submit_if_done(); }


            });
    }
    /**
     * Here it searches for an email */
    function contact_response(response,extension) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j, email_val, my_match;
        if(extension===undefined) extension='';
        console.log("in contact_response "+response.finalUrl);
        var short_name=response.finalUrl.replace(my_query.url,"");//.replace(/[\/]+/g,"");
        var links=doc.links,email_matches=doc.body.innerHTML.match(email_re);
        var phone_matches=doc.body.innerText.match(phone_re);
        var replacement=response.finalUrl.match(/^https?:\/\/[^\/]+/)[0];
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        if(email_matches)
        {
            for(i=0; i < email_matches.length;i++)
            {
                if(!MTurkScript.prototype.is_bad_email(email_matches[i]))
                {
                    my_query.fields.email=email_matches[i];
                    break;
                }
            }
        }

        for(i=0; i < links.length; i++)
        {
           // console.log("i="+i+", text="+links[i].innerText);
            if(extension==='')
            {
                if(/(Contact|About)/i.test(links[i].innerText))
                {
                    console.log("blunk");
                   // console.log(my_query.url.match(/https?:\/\/[^\/]+/));
                    curr_url=links[i].href;
                    temp_url=window.location.href.replace(/\/$/,"");
                    while(temp_url.split("/").length>=3)
                    {
                        links[i].href=links[i].href.replace(temp_url,replacement);
                        temp_url=temp_url.replace(/\/[^\/]+$/,"");
                        console.log("link="+links[i].href+", temp_url="+temp_url);
                    }
                    let new_link=links[i].href;
                    if(!my_query.queryList.includes(new_link))
                    {
                        my_query.queryList.push(new_link);
                        console.log("*** Following link labeled "+links[i].innerText+" to "+new_link);
                        get_page(new_link,
                                 contact_response,"NOEXTENSION");
                    }
                }
            }
            if(my_query.fields.email.length>0) break;
            if(links[i].dataset.encEmail!==undefined)
            {
                console.log("### "+links[i].dataset.encEmail);
                let temp_email=MTurk.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@"));
                console.log("### "+temp_email);
                if(!MTurk.is_bad_email(temp_email))
                {
                    my_query.fields.email=temp_email;
                }

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
                    email_val=MTurk.cfDecodeEmail(encoded_match[1]);
                    console.log("DECODED "+email_val);
                    if(!MTurk.is_bad_email(email_val.replace(/\?.*$/,"")))
                    {
                        my_query.fields.email=email_val.replace(/\?.*$/,"");

                        my_query.doneEmail=true;
                    }
                }
            }
            if(email_re.test(links[i].href.replace(/^mailto:\s*/,"")))
            {
                email_val=links[i].href.replace(/^mailto:\s*/,"").match(email_re);
                console.log("Found emailBlop="+email_val);

                if(email_val.length>0 && !MTurk.is_bad_email(email_val))
                {
                    console.log("set email");
                    my_query.fields.email=email_val;

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
                my_query.fields.email=email_val;

            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1)
            {
                my_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/);
                console.log("my_match="+JSON.stringify(my_match));
                email_val=MTurk.DecryptX(my_match[1]);
                console.log("new email_val="+email_val);
                my_query.fields.email=email_val;
            }
        }



        console.log("my_query="+JSON.stringify(my_query));
        if(my_query.fields.email.length>0 && document.getElementById("email").value.length===0) {
            document.getElementById("email").value=my_query.fields.email;
            /* if(!my_query.submitted)
            {
                my_query.submitted=true;
                check_and_submit(check_function,automate);
            }*/


        }
        if(extension==='')
        {
            my_query.doneWeb=true;
        }
        else
        {
            my_query.doneQueries++;
        }
        submit_if_done();

        return;


    }


    function query_response(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in email_response");
        var email_match=doc.body.innerText.match(email_re);
        if(email_match!==null )
        {

             if(!is_bad_email(email_match[0]) && !my_query.submitted)
             {
                 my_query.submitted=true;
                document.getElementById("email").value=email_match[0];

                check_and_submit(check_function,automate);
                return;
             }
        }
//        GM_setValue("returnHit",true);
        return;

    }

    function fb_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
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

            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                if(b_algo[i].getElementsByClassName("b_caption")[0]!==undefined)
                    b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;



                if( !is_bad_name(b_name) && b_url.indexOf("/public/")===-1)
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


    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             callback(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function fb_promise_then(url) {
        my_query.fb_url=url;
        my_query.fb_url=my_query.fb_url.replace(/(https?:\/\/[^\/]*\/[^\/]*).*$/,"$1/about/?ref=page_internal")
        console.log("my_query.fb_url="+my_query.fb_url);
        GM_setValue("fb_url",my_query.fb_url);
    }



    function do_FB()
    {
        var i;
        var result={};

        console.log("Doing facebook");
        var wrappers=document.getElementsByClassName("_50f4");
        for(i=0; i < wrappers.length; i++)
        {
            console.log("wrappers["+i+"].innerText="+wrappers[i].innerText);
            if(email_re.test(wrappers[i].innerText))
            {
                console.log("found email in "+wrappers[i].innerText);
                var email_match=wrappers[i].innerText.match(email_re);
                result.email=email_match[0];
                GM_setValue("result",result);
                return;
            }
        }

        console.log("NO email found");

        GM_setValue("result",result);




    }

    function submit_if_done()
    {
        console.log("In submit_if_done. FB:"+my_query.doneFB+", Web:"+my_query.doneWeb);
        if(!my_query.doneFB || !my_query.doneWeb || my_query.doneQueries<my_query.queryList.length) return false;
        if(document.getElementById("email").value.length===0) {
            console.log("Found no emails");
            //document.getElementById("email").value="None@None.com";
           GM_setValue("returnHit",true); return;
        }
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(check_function,automate);
            return true;
        }
    }

    function init_Query()
    {

        var i;
       var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        my_query={name: wT.rows[0].cells[1].innerText, url: wT.rows[1].cells[1].innerText,
                  fb_url: wT.rows[2].cells[1].innerText, contact_name: wT.rows[3].cells[1].innerText,
                  submitted: false,fields:{email:""}, doneWeb: false, doneFB:false, queryList:[], doneQueries:0};

        console.log("MOOSE");

        GM_xmlhttpRequest({
            method: 'GET',
            url:    "http://"+my_query.url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             contact_response(response);
            },
            onerror: function(response) { console.log("error: response="+JSON.stringify(response)); my_query.doneWeb=true; submit_if_done(); },
            ontimeout: function(response) { my_query.doneWeb=true; submit_if_done(); }


            });
        GM_setValue("result","");
        GM_addValueChangeListener("result",function() {
            var result=GM_getValue("result");
            console.log("result="+JSON.stringify(result));
            console.log("my_query.submitted="+my_query.submitted);
            if(result.email!==undefined)
            {
                
                document.getElementById("email").value=result.email;
              
            }
            my_query.doneFB=true;
            submit_if_done();
        });
        if(my_query.fb_url.length>0)
        {
            console.log("my_query.fb_url=("+my_query.fb_url+")");
            GM_setValue("fb_url",my_query.fb_url+"/about/?ref=page_internal");
        }
        else
        {

            console.log("NO fb url");
            var search_str=my_query.name+" site:facebook.com";
            const fbPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, fb_response);
            });
            fbPromise.then(fb_promise_then
                             )
                .catch(function(val) {
                console.log("Failed at this fbPromise " + val); GM_setValue("returnHit",true); });
        }






    }

     if(window.location.href.indexOf("facebook.com")!==-1)
    {
        GM_setValue("fb_url","");
        GM_addValueChangeListener("fb_url",function() {
            var url=GM_getValue("fb_url");
            window.location.href=url;
        });
        setTimeout(do_FB, 3500);
    }

   

})();
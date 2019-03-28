// ==UserScript==
// @name        TestBed
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include     https://*youtube.com*
// @include http*trystuff.com*
// @include http*tryshit.com*
// @include http*twitter.com*
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
// @connect http*trystuff.com*
// @connect crunchbase.com
// @connect youtube.com
// @connect facebook.com
// @connect instagram.com
// @connect *
// @connect self
// @connect twitter.com
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

    function get_page(url,  callback,extension) {
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
                let temp_email=MTurkScript.prototype.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@"));
                console.log("### "+temp_email);
                if(!MTurkScript.prototype.is_bad_email(temp_email))
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
                    email_val=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]);
                    console.log("DECODED "+email_val);
                    if(!MTurkScript.prototype.is_bad_email(email_val.replace(/\?.*$/,"")))
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

                if(email_val.length>0 && !MTurkScript.prototype.is_bad_email(email_val))
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
                email_val=MTurkScript.prototype.DecryptX(my_match[1]);
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


        return;


    }

 
    function parse_twitter(doc,url,resolve,reject)
    {
        console.log("Help");

        console.log("doc.body.innerHTML="+doc.body.innerHTML);
    }


    function parse_youtube(doc,url,resolve,reject)  {
        console.log("Parsing youtube");
        var scripts=doc.scripts,i,j;
       // console.log("doc.body.innerHTML="+doc.body.innerHTML);
        //document.getElementById("content").innerHTML=doc.body.innerHTML;
        //document.head.innerHTML=document.head.innerHTML+"\n"+doc.head.innerHTML;
        var text;
        for(i=0; i < scripts.length; i++)
        {
            if(/^\s*window\[\"ytInitialData\"\]\s*\=\s*/.test(scripts[i].innerHTML))
            {
                text=scripts[i].innerHTML.replace(/^\s*window\[\"ytInitialData\"\]\s*\=\s*/,"");
                var old_text=scripts[i].innerHTML.replace(/^[^;]*;/,"");
                console.log("old_text="+old_text);

               // text=text.replace(/;[^;]*$/,"");
                while(/;/.test(text))
                {
                    text=text.replace(/;[^;]*$/,"");
                }
                //console.log("scripts["+i+"]="+text);
                var parsed=JSON.parse(text);
                var tabs=parsed.contents.twoColumnBrowseResultsRenderer.tabs;
                //console.log("JSON.stringify(tabs)="+JSON.stringify(tabs));
                for(j=0; j < tabs.length; j++)
                {
                    //console.log("tabs["+j+"]="+JSON.stringify(tabs[j]));
                    if(tabs[j].tabRenderer!==undefined && tabs[j].tabRenderer.content!==undefined) {
                        //let result=parse_yt_content(tabs[j].tabRenderer.content);
                        let contents=tabs[j].tabRenderer.content.sectionListRenderer.contents[0];
                        contents.itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer.bypassBusinessEmailCaptcha=true;

                        //console.log("tabs["+j+"].tabRenderer.content="+JSON.stringify(tabs[j].tabRenderer.content));
                    }
                }
                scripts[i].innerHTML=scripts[i].innerHTML.replace(/^(\s*window\[\"ytInitialData\"\]\s*\=\s*)[^;]*;/,
                                                                  "$1"+JSON.stringify(parsed));
               // console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);

            }
        }
        var x,temp_str;
        var yt=unsafeWindow;//.yt.config_;
        for(x in yt)
        {
            temp_str=x;
            try
            {
                if(typeof(yt[x])==="object") temp_str=temp_str+":"+JSON.stringify(yt[x]);
                else if(typeof(yt[x])==="function")temp_str=temp_str+":function";
                else temp_str=temp_str+":"+yt[x];
            }
            catch(error) { console.log("error with parsing \'"+x+"\', "+error); }
            console.log(temp_str);
        }
    }
    function parse_yt_content(content) {
        var i,j;
        var result={};
        var rend=
        console.log("contents="+JSON.stringify(rend));
        return result;
    }
    function parse_FB(doc,url,resolve,reject)
    {
        var scripts=doc.scripts,i,j;
        var code=doc.body.getElementsByTagName("code");
        for(i=0; i < code.length; i++)
        {
            console.log("code ("+i+")");
            code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
        }



        document.body.innerHTML=doc.body.innerHTML;
        document.head.innerHTML=document.head.innerHTML+"\n"+doc.head.innerHTML;
        /*
        require("TimeSlice").guard((function(){bigPipe.onPageletArrive({allResources:["qMi9y","iMqf3","HyjG2","xkI4c","P4bjz","3Mfrt","e10Oq","O+TDs","+qnqS","O3/JP","xEeYa","ZvIeY","NjL8M","LEYjV","0Qpka","CDQms","0yKpe","pSHFT","AWhBM","uSqb0","7fo+k","6koA8","fj25a","HyHwq","gOmcE","pNE1x"],displayResources:["qMi9y","iMqf3","HyjG2","xkI4c","P4bjz","3Mfrt","e10Oq","O+TDs","+qnqS","O3/JP","xEeYa","ZvIeY","NjL8M","LEYjV","0Qpka","CDQms","0yKpe","pSHFT","AWhBM","uSqb0","7fo+k","HyHwq","pNE1x"]
        */

        var good_script_regex=/.{0,300}gmail{0,300}/g;///^require\(\"TimeSlice\"\)\.guard/;
        // var good_script_regex=/^[^\{]+\{[^\{]+\{allResources:/;//(\[\"[A-Za-z0-9]+\"(?:,\"[^\"]+\")*\]),displayResources:(\[\"[A-Za-z0-9]+\"(?:,\"[^\"]+\")*\])/;
        var good_script_match;
        var good_count=0;
        //        not sure if this is consistently going to be enough to identify it tho
        for(i=0; i < scripts.length; i++)
        {
            good_script_match=scripts[i].innerHTML.match(good_script_regex);
            if(good_script_match)
            {
                for(j=0; j < good_script_match.length; j++)
                {
                    console.log("good_script_match["+i+"]["+j+"]="+good_script_match[j]);
                }
                // console.log("("+i+"), 1: "+good_script_match[1].length+", 2: "+good_script_match[2].length);
                good_count++;
                if(i>0)
                {
                    console.log("previous script["+(i-1)+"]="+scripts[i-1].innerHTML);
                }
                console.log("script["+i+"]="+scripts[i].innerHTML);

            }
        }
        good_script_match=doc.body.innerHTML.match(good_script_regex);
        if(good_script_match)
        {
            for(j=0; j < good_script_match.length; j++)
            {
                console.log("FULLDOC: good_script_match["+i+"]["+j+"]="+good_script_match[j]);
            }
        }



        console.log("*** good_count="+good_count+" ****\n");
    }
    function parse_promise_then(result) {
        console.log("parse_promise_then: result="+JSON.stringify(result));
    }

    function query_promise_then(result) { }

    function loadJS(url, implementationCode, location) {
        //url is URL of external file, implementationCode is the code
        //to be called from the file, location is the location to
        //insert the <script> element

        var scriptTag = document.createElement('script');
        scriptTag.src = url;

        scriptTag.onload = implementationCode;
        scriptTag.onreadystatechange = implementationCode;

        location.appendChild(scriptTag);
    }
    function scriptLoaded() {

        /* Change to MTurk */
        my_query.loadedScripts++;
        if(loaded_scripts===total_scripts)
        {
            console.log("Finished loading scripts");
            do_reactstuff();
        }
    }

    function parse_wipo(doc,url,resolve,reject) {
        console.log("url="+url);
        var i,j;
        var scripts=doc.scripts;
        for(i=0; i < scripts.length; i++)
        {
            console.log("scripts["+i+"]="+scripts[i].outerHTML);

        }
        var e = document.createElement("div");

 
    }

    function parse_FB_events(doc,url,resolve,reject)
    {
        var date_regex=/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\s+([\d]+),\s*([\d]+)/g;
        var time_regex=/([\d]+(?:\:[\d]{2})?)\s+(AM|PM)/g;
        var date_match,time_match;
        var result={success:true,place_url:"",eventid:""};
        var scripts=doc.scripts,i,j;
        var code=doc.body.getElementsByTagName("code"),goinglink,eventid,place,place_url;
        var evt_name,photo,photo_a,details,time,time_begin="",time_end="";

        for(i=0; i < code.length; i++)
        {

            code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
        }
        if((goinglink=doc.getElementsByClassName("_5z74"))&&goinglink.length>0&&
           (eventid=goinglink[0].href.match(/event_id\=([\d]+)/))) result.eventid=eventid[1];
        if((place=doc.getElementsByClassName("_5cmn")) && place.length>0 &&
           (place_url=place[0].getElementsByClassName("_5xhk")) &&
           place_url.length>0) result.place_url=place_url[0].href;
        if((evt_name=doc.getElementsByClassName("_5gmx")) &&
           evt_name.length>0) result.name=evt_name[0].innerText.trim();
        if((photo=doc.getElementsByClassName("_3kwh")).length>0 &&
           (photo_a=photo[0].getElementsByTagName("img")).length>0)
        {
            result.photo_url=photo_a[0].src;
        }
        if(details=doc.getElementsByClassName("_63ew").length>0) result.details=details.innerText;
        if((time=doc.getElementsByClassName("_2ycp")).length>0)
        {
            date_match=time[0].innerText.match(date_regex);
            time_match=time[0].innerText.match(time_regex);
            if(date_match&&time_match&&date_match.length>=1 &&time_match.length>=1)
            {
                if(date_match.length===1 && time_match.length>=1)
                {
                    result.begin_time=date_match[0]+" at "+time_match[0];
                    if(time_match.length>1) result.end_time=date_match[0]+" at "+time_match[1];
                }
                else if(date_match.length>1 && time_match.length>1)
                {
                     result.begin_time=date_match[0]+" at "+time_match[0];
                    result.end_time=date_match[1]+" at "+time_match[1];

                }

            }
        }



        document.body.innerHTML=doc.body.innerHTML;
        document.head.innerHTML=document.head.innerHTML+"\n"+doc.head.innerHTML;

        resolve(result);
    }


    var create_promise=function(url, parser, then_func, catch_func)
    {
        if(catch_func==undefined) catch_func=function(response) { console.log("Request to url failed "+response); };
        const queryPromise = new Promise((resolve, reject) => {
            var a=GM_xmlhttpRequest(
                {method: 'GET', url: url,
                 headers: {"referer":"https://twitter.com/","upgrade-insecure-requests":1,"script-src":"https://twitter.com"},
                 onload: function(response) {
                   /*  for(var x in response)
                     {
                         console.log("response["+x+"]="+response[x]);
                     }*/
                     var doc = new DOMParser()
                     .parseFromString(response.responseText, "text/html");
                  //   console.log("response.responseText="+response.responseText);
                     parser(doc,response.finalUrl, resolve, reject); },
                 onerror: function(response) { reject("Failed to load site "+response); },
                 ontimeout: function(response) {reject("Timed out loading site "+response); }
                });
           /* var y;
            for(y in a) { console.log("a["+y+"]="+a[y]);
                        }
            console.log("a="+JSON.stringify(a));*/
        });
        queryPromise.then(then_func)
            .catch(catch_func);
        return queryPromise;
    };

    var parse_FB_about=function(doc,url,resolve,reject)
{
    // console.time("fb_about");
    //console.log("this="+JSON.stringify(this));
    var result={};
    var code=doc.body.getElementsByTagName("code"),i,j,scripts=doc.scripts;
    for(i=0; i < scripts.length; i++)
    {
        if(/^bigPipe\.beforePageletArrive\(\"PagesProfileAboutInfoPagelet/.test(scripts[i].innerHTML) && i < scripts.length-1)
        {
            /* Parse the next one */
            result.hours=MTurkScript.prototype.parse_hours(scripts[i+1]);
        }
    }
    for(i=0; i < code.length; i++)
    {
        //console.log("code ("+i+")");
        code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
    }
    var about_fields=doc.getElementsByClassName("_3-8j"),inner_field1,text;
    var _a3f=doc.getElementsByClassName("_a3f"),coord_ret; // map with coords

    if(_a3f.length>0 && (coord_ret=MTurkScript.prototype.FB_match_coords(_a3f[0].src))) {
        for(i in coord_ret) result[i]=coord_ret[i];
    }

    for(i=0; i < about_fields.length; i++)
    {
        //  console.log("about_fields["+i+"].className="+about_fields[i].className);
        inner_field1=about_fields[i].getElementsByClassName("_50f4");
        if(about_fields[i].className.toString().indexOf("_5aj7")!==-1 &&
           about_fields[i].className.toString().indexOf("_20ud")!==-1 &&
           about_fields[i].getElementsByClassName("_4bl9").length>0)
        {
            //console.log("Found address");
            result.address="";
            let add_fields=about_fields[i].getElementsByClassName("_2iem");
            for(j=0; j < add_fields.length; j++) result.address=result.address+add_fields[j].innerText+",";
            result.address=result.address.replace(/,$/,"");
        }
        if(inner_field1.length===0) continue;
        text=inner_field1[0].innerText;
        if(email_re.test(text)) result.email=text;
        else if(inner_field1[0].parentNode.tagName==="DIV" &&
                !/_4bl9/.test(inner_field1[0].parentNode.className)) result.url=text;
        else if(/twitter\.com/i.test(text)) result.twitter_url=text;
        else if(/instagram\.com/i.test(text)) result.insta_url=text;
        else if(/pinterest\.com/i.test(text)) result.pinterest_url=text;
        else if(phone_re.test(text)) result.phone=text.match(phone_re)[0];
        else if(/^About$/i.test(text) && about_fields[i].getElementsByClassName("_3-8w").length>0) {
            result.about=about_fields[i].getElementsByClassName("_3-8w")[0].innerText; }


    }
    //console.log("result="+JSON.stringify(result));
    resolve(result);
    //console.timeEnd("fb_about");
};

    function do_stuff(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var content=doc.getElementById("content");
        if(content) console.log("content="+content.outerHTML);
        else console.log("response.responseText="+response.responseText);
        console.log("response.finalUrl="+response.finalUrl);
    }
    function init_Query()
    {
//        var dont=document.getElementsByClassName("dont-break-out")[0].href;
  //      var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
   document.body.innerHTML="<b>Testing</b>";
      //  document.getElementById("ads").innerHTML="<div id=\"divReactPortletCSS\"></div>";
        var url="https://swanscreekes.pwcs.edu/staff_directory";
           my_query={loadedScripts:0,totalScripts:0,url:url,job_title:"principal"};
        my_query.staff_path=url.match(/^https?:\/\/[^\/]+/)[0];
        var appendElement=document.getElementById("ads");


        url="http://www.casciac.org/memberschools/search.cgi";
        var data={"action":"search","search_type":"schools",
                  "school_name":"Crosby","city_town":"","category":"",
                  "principal":"",
                  "assistant_principal":"","athletic_director":"",boolean:"and"};
        var headers={"Content-Type": "application/x-www-form-urlencoded","referer":"http://cas.casciac.org/?page_id=6",
                     "origin":"http://cas.casciac.org","host":"www.casciac.org","Upgrade-Insecure-Requests":1
                    };
        GM_xmlhttpRequest({method: 'POST', url: url,data:"action=search&search_type=schools&school_name=Crosby&boolean=and",headers:headers,
            onload: function(response) { do_stuff(response) },
            onerror: function(response) { console.log("Fail");
                                        var x;
                                         for(x in response) { console.log("response["+x+"]="+response[x]); }

                                        },
            ontimeout: function(response) { console.log("Fail ");

                                          }
                          });

        var fb_search_url="https://www.facebook.com/search/pages/?q="+encodeURIComponent("Fraser Department of Public Safety");
        var insta_url="https://www.instagram.com/natsfert/";
        var wipo_url="http://www.wipo.int/branddb/en/";
        var fb_events_url="https://www.facebook.com/pg/listasafn.islands/about"; //https://www.facebook.com/events/756047901414839/
        var promise_list=[];
        //promise_list.push(create_promise(yt_url,parse_youtube,parse_promise_then));

        var twitter_url="https://twitter.com/hsdistrict211";
         //promise_list.push(MTurkScript.prototype.create_promise(wipo_url,parse_wipo,parse_promise_then));
        console.log("MOO");
       // promise_list.push(MTurkScript.prototype.create_promise(fb_events_url,parse_FB_about,parse_promise_then));
        console.log("SHROO");
    }
    if(window.location.href.indexOf("trystuff.com")!==-1)
    {
        init_Query();
    }



})();

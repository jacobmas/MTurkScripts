// ==UserScript==
// @name         ParseChurch
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.facebook.com*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var bad_urls=["rchurch.com","facebook.com","thecatholicdirectory.com","parishesonline.com"];
     var my_query = {};

    var MTurk=new MTurkScript(20000,0,[],init_Query,"A2V2LI4XREXYJR");

    function is_bad_name(b_name,b_url) {
        return false;
    }

    function parse_lgb_info() { }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,b_context_result;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(b_context)
            {
                b_context_result=MTurk.parse_b_context(b_context);
                console.log("b_context_result="+JSON.stringify(b_context_result));
                if(b_context_result.Website!==undefined && b_context_result.Title!==undefined &&

                   !/School/.test(b_context_result.Title) && !MTurkScript.prototype.is_bad_url(b_context_result.Website,bad_urls,-1)
                                                                                              ) { resolve(b_context_result.Website);
                                                            return;
                                                           }

            }
            console.log(JSON.stringify(b_context_result));


	    

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
  if(!MTurk.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
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
    function query_promise_then(url) {
        GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { parse_church(response); },
            onerror: function(response) { console.log("Fail church"); },
            ontimeout: function(response) { console.log("Fail church"); }
            });

    }

    function parse_church(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_church\n"+response.finalUrl);
        my_query.fields.website=response.finalUrl;
        
        var sac=doc.getElementsByClassName("sacramentTimesModule"),i;
        find_links(doc,response.finalUrl);
        call_links();
        contact_response(response);
        find_mass(doc,response.finalUrl);
        add_to_sheet();
        submit_if_done();
    }

    function find_links(doc,url)
    {
        var i,j,links=doc.links;
        var contact_regex=/(^Staff)|Contact/i;
        var mass_regex=/^Mass/i;
        var curr_url=window.location.href,temp_url;
        var to_replace= window.location.href.match(/^https?:\/\/[^\/]+/)[0];
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        console.log("to_replace="+to_replace);
        for(i=0; i < links.length; i++)
        {
            temp_url=curr_url.replace(/\/$/,"");
            while(temp_url.split("/").length>=3)
            {
                links[i].href=links[i].href.replace(temp_url,replacement);
                temp_url=temp_url.replace(/\/[^\/]+$/,"");
            }
            links[i].href=links[i].href.replace(to_replace,replacement);
         //   console.log("links["+i+"].innerText="+links[i].innerText);
            if((mass_regex.test(links[i].innerText.trim()) ||
                /contact/.test(links[i].href))
                && !my_query.mass_links.includes(links[i].href))
            {
                my_query.mass_links.push(links[i].href);
            }
            if(contact_regex.test(links[i].innerText) && !my_query.contact_links.includes(links[i].href))
            {
                my_query.contact_links.push(links[i].href);
            }
        }

        console.log("my_query.contact_links="+JSON.stringify(my_query.contact_links)+"\n"+
                   "my_query.mass_links="+JSON.stringify(my_query.mass_links));

    }

    function call_links()
    {
        var i;
        for(i=0; i < my_query.contact_links.length; i++)
        {
            console.log("calling contact "+i+", "+my_query.contact_links[i]);
            GM_xmlhttpRequest({method: 'GET', url: my_query.contact_links[i],
                               onload: function(response) { do_contact(response) },
                               onerror: function(response) { console.log("Fail "+my_query.contact_links[i]); },
                               ontimeout: function(response) { console.log("Fail "+my_query.contact_links[i]); }
                              });
        }
        for(i=0; i < my_query.mass_links.length; i++)
        {
            console.log("calling mass "+i+", "+my_query.mass_links[i]);
            GM_xmlhttpRequest({method: 'GET', url: my_query.mass_links[i],
                               onload: function(response) { do_mass(response) },
                               onerror: function(response) { console.log("Fail "+my_query.mass_links[i]); },
                               ontimeout: function(response) { console.log("Fail "+my_query.mass_links[i]); }
                              });
        }
    }
    function do_contact(response)
    {
        contact_response(response);
        my_query.done_contact++;
        submit_if_done();
    }

    function do_mass(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        find_mass(doc);
        my_query.done_mass++;
        submit_if_done();
    }



    function find_mass(doc,url)
    {
        var i,j,divs=doc.getElementsByTagName("div");
        var mass_regex=/((Mass Times)|(Mass Schedule)|(Masses))[^\n:]*:?/i,text;
        for(i=0; i < divs.length; i++)
        {
            if(divs[i].getElementsByTagName("div").length>0) continue;
           // console.log("divs["+i+"].innerText="+divs[i].innerText);
            if(mass_regex.test(divs[i].innerText) && /\d{1,2}:\d{2}/.test(divs[i].innerText))
            {
                console.log("text("+i+")= "+divs[i].className+", innerText="+divs[i].innerText);

                text=divs[i].innerText.replace(mass_regex,"");
                text=text.replace(/\t|\s{2,}/g,"\n");
                text=text.replace(/(\n)(\t|\s)*/g,"$1");
                my_query.fields.content=my_query.fields.content+text.trim()+"\n";
            }
        }
        if(my_query.fields.content.length===0 && doc.getElementsByClassName("sacramentTimesModule").length>0)
        {
            let text=doc.getElementsByClassName("sacramentTimesModule")[0].innerText.replace(/Mass Times\s*/,"").replace(/\n\s*/g,"\n")
            .replace(/EnglishEnglishEN/g,"English").replace(/SpanishEspañolES/g,"Spanish").trim();
            console.log("text="+text);
            my_query.fields.content=text;
        }
    }

    function submit_if_done()
    {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.fields) if(my_query.fields[x].length===0) is_done=false;
        if(is_done && my_query.done_contact===my_query.contact_links.length &&
           my_query.done_mass===my_query.mass_links.length && !my_query.submitted)
        {
            my_query.submitted=true;
            MTurk.check_and_submit();
        }
    }


    /**
     * Here it searches for an email */
    function contact_response(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j, email_val, my_match;
        console.log("in contact response "+response.finalUrl);
        var short_name=response.finalUrl.replace(my_query.url,"");//.replace(/[\/]+/g,"");
        var links=doc.links,email_matches=doc.body.innerHTML.match(email_re);
        var phone_matches=doc.body.innerText.match(phone_re);
        if(email_matches)
        {
            for(i=0; i < email_matches.length; i++)
            {
                if(!MTurk.is_bad_email(email_matches[i]))
                {
                    my_query.fields.email=email_matches[i];
                    break;
                }
            }
        }
       
        for(i=0; i < links.length; i++)
        {
            if(links[i].innerText==="Webmaster") continue;
           /* if(extension==='')
            {
                if(/^(Contact|About)/i.test(links[i].innerText))
                {
                   // console.log(my_query.url.match(/https?:\/\/[^\/]+/));
                    let new_link=links[i].href.replace(/https?:\/\/[^\/]+/,my_query.url.match(/https?:\/\/[^\/]+/));
                    console.log("*** Following link labeled "+links[i].innerText+" to "+new_link);
                    get_page(new_link,
                             resolve, reject, contact_response,"NOEXTENSION");
                }
            }*/
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
             //   console.log(short_name+": ("+i+")="+links[i].href);
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

                //='mailto:'+String.fromCharCode(


        }
    /*    if(email_matches!==null)
        {
            j=0;
            for(j=0; j < email_matches.length; j++)
            {
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0) {
                   my_query.fields.email=email_matches[j];
                   break;
                }
            }



        }*/
        add_to_sheet();
        if(my_query.fields.email.length>0) return true;
        return false;


    }

    /* Facebook search stuff */
     function parse_FB(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("response.finalUrl="+response.finalUrl);
        //console.log("doc.body.innerHTML="+doc.body.innerHTML);
        //console.log("doc.body.innerHTML.indexOf(\"Church\")="+doc.body.innerHTML.indexOf("Church"));
        var scripts=doc.scripts,i;

        /*
        require("TimeSlice").guard((function(){bigPipe.onPageletArrive({allResources:["qMi9y","iMqf3","HyjG2","xkI4c","P4bjz","3Mfrt","e10Oq","O+TDs","+qnqS","O3/JP","xEeYa","ZvIeY","NjL8M","LEYjV","0Qpka","CDQms","0yKpe","pSHFT","AWhBM","uSqb0","7fo+k","6koA8","fj25a","HyHwq","gOmcE","pNE1x"],displayResources:["qMi9y","iMqf3","HyjG2","xkI4c","P4bjz","3Mfrt","e10Oq","O+TDs","+qnqS","O3/JP","xEeYa","ZvIeY","NjL8M","LEYjV","0Qpka","CDQms","0yKpe","pSHFT","AWhBM","uSqb0","7fo+k","HyHwq","pNE1x"]
        */

        var good_script_regex=/tuid:/;///^require\(\"TimeSlice\"\)\.guard/;
       // var good_script_regex=/^[^\{]+\{[^\{]+\{allResources:/;//(\[\"[A-Za-z0-9]+\"(?:,\"[^\"]+\")*\]),displayResources:(\[\"[A-Za-z0-9]+\"(?:,\"[^\"]+\")*\])/;
        var good_script_match;
        var good_count=0;
//        not sure if this is consistently going to be enough to identify it tho
        for(i=0; i < scripts.length; i++)
        {
            good_script_match=scripts[i].innerHTML.match(good_script_regex);
            if(good_script_match)
            {
                console.log("good_script_match["+i+"]="+JSON.stringify(good_script_match));
               // console.log("("+i+"), 1: "+good_script_match[1].length+", 2: "+good_script_match[2].length);
                good_count++;
                console.log("script["+i+"]="+scripts[i].innerHTML);
            }
        }
        console.log("*** good_count="+good_count+" ****\n");
    }


    function add_to_sheet()
    {
        var x;
        for(x in my_query.fields) document.getElementById(x).value=my_query.fields[x];
    }






    function init_Query()
    {
        //var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:wT.rows[1].cells[1].innerText,street:wT.rows[2].cells[1].innerText,city:wT.rows[3].cells[1].innerText,
                 state:wT.rows[4].cells[1].innerText.charAt(0).toUpperCase()+wT.rows[4].cells[1].innerText.substr(1),
                 zip:wT.rows[5].cells[1].innerText,fields:{website:"",content:"",email:""},submitted:false,
                 contact_links:[],mass_links:[],done_contact:0,done_mass:0};
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.city+" "+my_query.state;

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
                         )
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

        GM_xmlhttpRequest({method: 'GET', url: "https://www.facebook.com/search/pages/?q="+encodeURIComponent(my_query.name+" "+my_query.city+" "+my_query.state),
            onload: function(response) {
                console.log("\n\n\n***** MOOO ****\n\n\n");
                parse_FB(response); },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });




    }

   




})();
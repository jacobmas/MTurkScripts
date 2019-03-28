// ==UserScript==
// @name         BusinessTwitter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Get Stuff about Business from Twitter
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @include https://*twitter.com*
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
    var my_query = {};
    var bad_urls=["facebook.com"];

    var british_phone_re=/(\+44[\s\d\(\)]+)|(\d{5}\s\d{3}\s\d{3})/;


    var MTurk=new MTurkScript(20000,0,[],init_Query,"AB1V1E3WP4MX0");


  
    
    function is_bad_name(b_name)
    {
	return false;
    }

    function parse_brit_address(to_parse)
    {
        my_query.fields.country="GB";
        to_parse=to_parse.replace(/,\s*,/g,",");
        console.log("to_parse="+to_parse);

        var zip_regex=/\s*([A-Z\d]{3,4} [A-Z\d]{3,4})$/;
        var zip_match=to_parse.match(zip_regex);
        if(zip_match)
        {
            my_query.fields.zip=zip_match[1];
            to_parse=to_parse.replace(zip_regex,"");
        }
        to_parse=to_parse.trim();
        to_parse=to_parse.replace(/[,\.]+$/,"").trim();
        console.log("to_parse="+to_parse);
        var add_split=to_parse.split(",");
        console.log("add_split="+JSON.stringify(add_split));
        my_query.fields.city=add_split[add_split.length-1].trim();
        if(add_split.length>=2)
        {
            my_query.fields.addressLine1="";
            for(var i=0; i < add_split.length-1; i++)
            {
                my_query.fields.addressLine1=my_query.fields.addressLine1+add_split[i].trim()+",";
            }
            my_query.fields.addressLine1=my_query.fields.addressLine1.replace(/,$/,"");
        }
        else
        {
            console.log("Problems parsing address "+to_parse);
        }
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        var lgb_result,b_context_result;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(lgb_info)
            {

                lgb_result=parse_lgb_info(lgb_info);
                console.log("lgb_result="+JSON.stringify(lgb_result));
                if(lgb_result.phone!==undefined && lgb_result.phone.length>0) my_query.fields.phoneNumber=lgb_result.phone;
                if(lgb_result.address!==undefined && lgb_result.address.length>0) parse_brit_address(lgb_result.address);
                add_to_sheet();
            }
            if(b_context)
            {
                b_context_result=MTurk.parse_b_context(b_context);
                console.log("b_context_result="+JSON.stringify(b_context_result));
            }

	    

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

    function parse_lgb_info(lgb_info)
    {
        var intl_phone_re=/^\+[\d\s\-\(\)]+/;

        var result={"phone":"","name":"",url:""},bm_details_overlay,b_factrow,i,b_entityTitle;
        b_entityTitle=lgb_info.getElementsByClassName("b_entityTitle");
        bm_details_overlay=lgb_info.getElementsByClassName("bm_details_overlay");
        if(bm_details_overlay.length>0) result.address=bm_details_overlay[0].innerText;
        b_factrow=lgb_info.getElementsByClassName("b_factrow");
        if(b_entityTitle.length>0)
        {
            result.name=b_entityTitle[0].innerText;
            if(b_entityTitle[0].getElementsByTagName("a").length>0)
            {
                result.url=b_entityTitle[0].getElementsByTagName("a")[0].href;
            }
        }
        for(i=0; i < b_factrow.length; i++)
        {
            if(phone_re.test(b_factrow[i].innerText) || intl_phone_re.test(b_factrow[i].innerText)) result.phone=b_factrow[i].innerText;
        }
        return result;
    };

    function parse_website(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_website\n"+response.finalUrl);
        contact_response(response,'');

    }

    function get_page(url, callback,extension)
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

        var phone_matches=doc.body.innerText.match(british_phone_re);
        var replacement=response.finalUrl.match(/^https?:\/\/[^\/]+/)[0];
        console.log("replacement="+replacement);
        var temp_url,curr_url;

        if(email_matches!==null)
        {
            j=0;
            console.log("email_matches="+JSON.stringify(email_matches));
            for(j=0; j < email_matches.length; j++)
            {
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0) {

                   my_query.fields.email=email_matches[j];
                  //  document.getElementsByName("Email ")[0].value=my_query.email;
                   break;
                }
            }


            console.log("Found email hop="+my_query.fields.email);
        }
        if(phone_matches)
        {
            my_query.fields.phoneNumber=phone_matches[0];
        }


        for(i=0; i < links.length; i++)
        {
           // console.log("i="+i+", text="+links[i].innerText);
            if(extension==='')
            {
                if(/(Contact|About|Privacy)/i.test(links[i].innerText) && !/^\s*mailto/i.test(links[i].href))
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
            //if(my_query.fields.email.length>0) break;
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
            if(/^tel:/.test(links[i].href))
            {
                my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
                console.log("Found phone="+my_query.fields.phoneNumber);

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
        add_to_sheet();
        submit_if_done();

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
    function query_promise_then(result) {


    }

    function parse_twitter(doc)
    {
        var result={success:true,companyName:"",company_Website:"",location:"",email:""};
        console.log("Doing twitter");
       // console.log(doc.body.innerHTML);
        try
        {
            result.companyName=doc.getElementsByClassName("ProfileHeaderCard-nameLink")[0].innerText;
            if(doc.getElementsByClassName("ProfileHeaderCard-locationText").length>0)
            {
                result.location=doc.getElementsByClassName("ProfileHeaderCard-locationText")[0].innerText;
            }
            var bio=doc.getElementsByClassName("ProfileHeaderCard-bio");
            if(bio.length>0)
            {
                var email_match=bio[0].innerText.match(email_re);
                if(email_match) result.email=email_match[0].replace(/^.*\//,"");
            }
            if(doc.getElementsByClassName("ProfileHeaderCard-url").length>0 &&
               doc.getElementsByClassName("ProfileHeaderCard-url")[0].getElementsByTagName("a").length>0)
            {
                var url=doc.getElementsByClassName("ProfileHeaderCard-url")[0].getElementsByTagName("a")[0];
                console.log("url.href="+url.href+", url.title="+url.title);
                result.company_Website=url.title;
            }
        }
        catch(error) { console.log("Error parsing twitter"); result.success=false; }
        GM_setValue("twitter_result",result);

    }



    function add_to_sheet()
    {
        for(var x in my_query.fields) {
            if(document.getElementById(x))
            {
                document.getElementById(x).value=my_query.fields[x];
            }
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
            MTurkScript.prototype.check_and_submit();
        }
    }


    function paste_address(e)
    {
        e.preventDefault();
        // get text representation of clipboard
        var text = ""+e.clipboardData.getData("text/plain");
        text=text.replace(/(\n)\s+/g,"\n").replace(/\n/g,",").replace(/,\s*$/,"");
        parse_brit_address(text);
        add_to_sheet();
    }

    function paste_element(e)
    {
        e.preventDefault();
        var text = ""+e.clipboardData.getData("text/plain");
        my_query.fields[e.target.id]=text;
        add_to_sheet();
    }

    function init_Query()
    {
        console.log("in init_Query");
        var dont=document.getElementsByClassName("dont-break-out")[0].href;
        //var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={url:dont,fields:{"company_Website":"",companyName:"",email:""},doneWebsite:false,doneBing:false,
                 queryList:[]};
        document.getElementById("addressLine1").addEventListener("paste",paste_address);
        var ctrl=document.getElementsByClassName("form-control"),i;
        for(i=0; i<ctrl.length;i++)
        {
            if(ctrl[i].id!=="addressLine1") ctrl[i].addEventListener("paste",paste_element);
        }

        GM_setValue("twitter_result","");
        GM_addValueChangeListener("twitter_result",twitter_result_change);
        GM_setValue("twitter_url",my_query.url);
        GM_xmlhttpRequest({method: 'GET', url: my_query.url,
            onload: function(response) { var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");   parse_twitter(doc); },
            onerror: function(response) { console.log("Failed Twitter"); },
            ontimeout: function(response) { console.log("Failed Twitter"); }
            });
	




    }

    function twitter_result_change()
    {
        var result=arguments[2],x;
        console.log("result="+JSON.stringify(result));
        if(!result.success) return;
        for(x in my_query.fields)
        {
            if(result[x]!==undefined) my_query.fields[x]=result[x];
        }
        add_to_sheet();
        console.log("my_query="+JSON.stringify(my_query));
        if(my_query.fields.company_Website.length>0 && !MTurk.is_bad_url(my_query.fields.company_Website,bad_urls,-1))
        {
            GM_xmlhttpRequest({method: 'GET', url: my_query.fields.company_Website,
                               onload: function(response) { parse_website(response); },
                               onerror: function(response) { console.log("Fail at opening website"); },
                               ontimeout: function(response) { console.log("Fail at opening website-timeout"); }
                              });
        }
        if(my_query.fields.companyName.length>0)
        {
            var search_str=my_query.fields.companyName;
            if(result.location.length>0) search_str=search_str+" "+result.location;
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response);
            });
            queryPromise.then(query_promise_then
                             )
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        }

    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


   

    if(window.location.href.indexOf("twitter.com")!==-1)
    {
        GM_setValue("twitter_url",{url:"https://www.twitter.com",website:false});
        console.log("Doing twitter "+window.location.href);
        my_query=GM_getValue("my_query");

        GM_addValueChangeListener("twitter_url",function() {
            window.location.href=arguments[2];
        });
        setTimeout(parse_twitter,2000,document);
    }
   


})();
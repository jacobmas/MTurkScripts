// ==UserScript==
// @name         ScrapeEmails
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*facebook.com/*
// @include https://*facebook.com*
// @include https://*instagram.com/*
// @include file://*
// @include https://*newsroom.fb.com/*
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
    var fb_listener;
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


    function swrot13(str)
    {
        var i;
        str=str.toLowerCase();
        var new_str="";
        for(i=0; i < str.length; i++)
        {
            if(/[a-z]/.test(str.substr(i,1)))
            {
                new_str=new_str+String.fromCharCode(((str.charCodeAt(i)-'a'.charCodeAt(0)+13)%26)+'a'.charCodeAt(0));
            }
            else new_str=new_str+str.charAt(i);
        }
        return new_str;
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

    function DeCryptX( s )
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
	return false;
    }

    function query_response(response,resolve,reject) {
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
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		if(b_caption.length>0) b_caption=b_caption[0].innerText;
                console.log("query ("+i+"): "+b_url);



                if( !is_bad_name(b_name) && b_url.indexOf("/tags/")===-1)
                {
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
		/* Do shit */
            console.log("*** Resolving ***");
            resolve(b_url);

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

    function is_bad_email(to_check)
    {
        if(to_check.indexOf("@2x.png")!==-1 || to_check.indexOf("@2x.jpg")!==-1) return true;
        else if(to_check.indexOf("s3.amazonaws.com")!==-1) return true;
        else if(/user@example\.com/.test(to_check)) return true;
        return false;
    }

    /**
    *  Search the contact page
    */
    function contact_response(response,resolve,reject,extension) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j, email_val, my_match;
        var foundInsta=false, foundFB=false;
        console.log("in contact response "+response.finalUrl);
        var short_name=response.finalUrl.replace(my_query.url,"");//.replace(/[\/]+/g,"");
        var links=doc.links,email_matches=doc.body.innerHTML.match(email_re);
        var phone_matches=doc.body.innerHTML.match(phone_re);
        if(email_matches!==null)
        {
            j=0;
            for(j=0; j < email_matches.length; j++)
            {
                if(!is_bad_email(email_matches[j]) && email_matches[j].length>0) {

                   my_query.email=email_matches[j];
                  //  document.getElementsByName("Email ")[0].value=my_query.email;
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
               my_query.phone=phone_matches[j];

                break;

            }


            console.log("Found phone hop="+my_query.phone);
        }
        GM_setValue("fb_result","");
        if(fb_listener===undefined)
        {
            fb_listener=GM_addValueChangeListener("fb_result",function() {
                console.log("Received FB_result="+JSON.stringify(arguments[2]));
                if(my_query.doneFB) return;
                var result=arguments[2];
                if(result.email.length>0 && !is_bad_email(result.email)) { my_query.email=result.email; console.log("FB: got email="+my_query.email);  }
                if(result.name.length>0) { my_query.name=result.name; console.log("FB: got name="+my_query.name); }
                if(result.phone.length>0) { my_query.phone=result.phone; console.log("FB: got phone="+my_query.phone); }

                my_query.doneFB=true;
                add_and_submit();

                /* Check if done */
            });
        }
        GM_setValue("insta_result","");
        GM_addValueChangeListener("insta_result",function() {
             if(my_query.doneInstagram) return;
            var result=arguments[2];
            if(result.email.length>0) { my_query.email=result.email; console.log("IG: got email="+my_query.email); }
            if(result.name.length>0 && result.name!==undefined && !(my_query.doneFB && my_query.name.length>0)) { my_query.name=result.name; console.log("IG: got name="+my_query.name); }
            if(result.insta_name.length>0) { my_query.insta_name=result.insta_name; console.log("IG: got account="+my_query.insta_name); }
            if(result.followers.length>0) { my_query.followers=result.followers; console.log("IG: followers="+my_query.followers); }
            /* Check if done */
            my_query.doneInstagram=true;
            add_and_submit();
                });
        for(i=0; i < links.length; i++)
        {
            if(extension==='')
            {
                if(/^(Contact|About)/i.test(links[i].innerText))
                {
                   // console.log(my_query.url.match(/https?:\/\/[^\/]+/));
                    let new_link=links[i].href.replace(/https?:\/\/[^\/]+/,my_query.url.match(/https?:\/\/[^\/]+/));
                    console.log("*** Following link labeled "+links[i].innerText+" to "+new_link);
                    get_page(new_link,
                             resolve, reject, contact_response,"NOEXTENSION");
                }
            }
            if(links[i].dataset.encEmail!==undefined)
            {
                console.log("### "+links[i].dataset.encEmail);
                let temp_email=swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@"));
                console.log("### "+temp_email);
                if(!is_bad_email(temp_email))
                {
                    my_query.email=temp_email;
                }

            }
            else
            {
               // console.log("links["+i+"].dataset="+JSON.stringify(links[i].dataset));
            }
            if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
            {
                console.log(short_name+": ("+i+")="+links[i].href); }
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1)
            {
                var encoded_match=links[i].href.match(/#(.*)$/);
                if(encoded_match!==null)
                {
                    email_val=cfDecodeEmail(encoded_match[1]);
                    console.log("DECODED "+email_val);
                    if(!is_bad_email(email_val.replace(/\?.*$/,"")))
                    {
                        my_query.email=email_val.replace(/\?.*$/,"");
                   
                        my_query.doneEmail=true;
                    }
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
          
            }
              if(links[i].href.indexOf("javascript:DeCryptX(")!==-1)
            {
               my_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/);
                console.log("my_match="+JSON.stringify(my_match));
                email_val=DecryptX(my_match[1]);
                console.log("new email_val="+email_val);
            }

                //='mailto:'+String.fromCharCode(
            if(links[i].href.indexOf("facebook.com")!==-1 && links[i].href.indexOf("share.php")===-1 && links[i].href.indexOf("sharer.php")===-1&& !my_query.doneFB && !foundFB)
            {
                foundFB=true;
                my_query.fb_url=links[i].href.replace("#!/","");
;
                console.log("Found FB url="+my_query.fb_url);
                if(my_query.fb_url.indexOf("/pages/")===-1) my_query.fb_url=my_query.fb_url.replace(/\/$/,"")+"/about/?ref=page_internal";
console.log("Found FB url="+my_query.fb_url);
                if(!my_query.started_FB)
                {
                    my_query.started_FB=true;
                    GM_setValue("fb_url",my_query.fb_url);
                }
            }
            if(links[i].href.indexOf("instagram.com")!==-1 && !my_query.doneInstagram && !foundInsta && links[i].href.indexOf("instagram.com/p/")===-1)
            {
                foundInsta=true;
                my_query.insta_url=links[i].href;
                console.log("Found insta url="+my_query.insta_url);

                if(!my_query.started_Insta)
                {
                    my_query.started_Insta=true;
                    GM_setValue("instagram_url",my_query.insta_url);
                }
            }
        }
        add_and_submit();


    }



    function add_and_submit()
    {
        console.log("Doing add and submit");
        if(my_query.email.length>0)
        {
            document.getElementById("email").value=my_query.email;
        }
        if(my_query.phone.length>0)
        {
            document.getElementById("Phone").value=my_query.phone;
        }
        if(my_query.name.length>0 && my_query.email.length>0 &&
           my_query.doneFB && !my_query.submitted && my_query.phone.length)
        {
            my_query.submitted=true;
            console.log("Done");

            check_and_submit(check_function,automate);
        }
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
    function query_promise_then(url) {

        if(fb_listener===undefined)
        {
            fb_listener=GM_addValueChangeListener("fb_result",function() {
                if(my_query.doneFB) return;
                var result=arguments[2];
                if(result.email.length>0) { my_query.email=result.email; console.log("FB: got email="+my_query.email);  }
                if(result.name.length>0) { my_query.name=result.name; console.log("FB: got name="+my_query.name); }

                my_query.doneFB=true;
                add_and_submit();

                /* Check if done */
            });
        }
        if(url.indexOf("facebook.com")!==-1 && !my_query.doneFacebook)
        {
            GM_setValue("fb_url",url);
        }

    }

     function contact_promise_then(result) {



    }


    function get_page(url, resolve, reject, callback,extension)
    {
        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             callback(response, resolve, reject,extension);
            },
            onerror: function(response) { reject("Page \'"+url+"\' not found");

            },
            ontimeout: function(response) { reject("Page \'"+url+"\' timed out"); }


            });
    }



    function init_Query()
    {
      //  GM_setValue("fb_url","http://www.facebook.com");
        //GM_setValue("instagram_url","http://www.instagram.com");
       // var url=document.getElementsByClassName("dont-break-out")[0].href;
       var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];


         my_query={url:wT.rows[0].cells[1].innerText, submitted: false, doneEmail: false, doneName: false, doneInstagram: false, fb_url: "", insta_url:"", doneFB: false,

                 email:"",followers:0,insta_name:"",name:" ", started_FB: false, started_Insta: false,donePhone:false, phone:""};

        my_query.url=my_query.url.replace(/(https?:\/\/[^\/]+)\/.*$/,"$1");
        console.log("my_query.url="+my_query.url);

	var search_str=get_domain_only(my_query.url)+" site:facebook.com";

      /*  my_query={url:wT.rows[0].cells[1].innerText, submitted: false, doneEmail: false, doneName: false, doneInstagram: false, fb_url: "", insta_url:"", doneFB: false,

                 email:"",followers:0,insta_name:"",name:" ", started_FB: false, started_Insta: false};

        my_query.url=my_query.url.replace(/(https?:\/\/[^\/]+)\/.*$/,"$1");
        console.log("my_query.url="+my_query.url);*/

	//var search_str=get_domain_only(my_query.url)+" site:facebook.com";
    /*    const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); }); */

        var extensions=[''];//,'/contact','/privacy','/includes/modules/contactinfo.php','/about/','/contact.php','/contact-us'];
        var i;
        var promises=[];
        var currPromise;
        for(i=0; i < extensions.length; i++)
        {
            currPromise = new Promise((resolve, reject) => {
                console.log("Beginning search for "+my_query.url+extensions[i]);
                get_page(my_query.url+extensions[i], resolve, reject, contact_response,extensions[i]);
            });
            currPromise.then(contact_promise_then
                            )
                .catch(function(val) {
                console.log("Failed at this "+extensions[i] + val);  });
        }

       /* const privacyPromise = new Promise((resolve, reject) => {
            console.log("Beginning privacy search");
            get_page(my_query.url+'/privacy', resolve, reject, contact_response);
        });
        privacyPromise.then(contact_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this contactPromise " + val);  });*/






    }

    function do_instagram()
    {
        console.log("Doing IG");
        var j;
        var result={email:"",name:"",insta_name:"",followers:"",url:window.location.href};
        var accountname=document.getElementsByClassName("AC5d8");
        var name=document.getElementsByClassName("rhpdm");
        var counts=document.getElementsByClassName("g47SY");
        var text_div=document.getElementsByClassName("-vDIg");
        var error_container=document.getElementsByClassName("error-container");
        if(error_container.length>0)
        {
            result.insta_name="@"+window.location.href.replace(/https:\/\/(www\.)?instagram\.com\//,"").replace(/\//g,"");
        }
        if(accountname.length>0)
        {
            result.insta_name="@"+accountname[0].innerText;
        }
        if(name.length>0) result.name=name[0].innerText.replace(/|.*$/,"").trim() ;
        if(counts.length>=3)
        {
            result.followers=counts[1].title.replace(/[\.\,]+/g,"");
        }
        if(text_div.length>0)
        {
            var email_matches=text_div[0].innerText.match(email_re);
            if(email_matches!==null && email_matches.length>0)
            {
                for(j=0; j < email_matches.length; j++)
                {
                    if(!is_bad_email(email_matches[j])) {

                        result.email=email_matches[j];
                        break;
                    }
                }
            }
        }
        console.log("Done IG");
        GM_setValue("insta_result",result);
    }

    function do_fb()
    {
        console.log("Doing FB");
        var result={email:"",name:"",url:window.location.href,phone:""};
        var i;
        var contactlinks=document.getElementsByClassName("_50f4");
        var namelinks=document.getElementsByClassName("_42ef");

        for(i=0; i < contactlinks.length; i++)
        {
            if(email_re.test(contactlinks[i].innerText))
            {
                result.email=contactlinks[i].innerText.match(email_re);
                console.log("Found email="+result.email);
            }
            else if(phone_re.test(contactlinks[i].innerText))
            {
                result.phone=contactlinks[i].innerText.match(phone_re);
                console.log("Found phone="+result.phone);
            }
        }
        for(i=0; i < namelinks.length; i++)
        {
            result.name=namelinks[i].innerText;
        }
          console.log("Done FB");
        GM_setValue("fb_result",result);

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
        if(/https?:\/\/www\.instagram\.com\/.+/.test(window.location.href)) {
            setTimeout(do_instagram,1500); }
    }
    else if(window.location.href.indexOf("facebook.com")!==-1)
    {
        GM_setValue("fb_url","https://www.facebook.com");
        console.log("Doing facebook");

        GM_addValueChangeListener("fb_url",function() {
            var url=GM_getValue("fb_url");
            console.log("url="+url);
            window.location.href=url;
        });
        if(window.location.href.indexOf("?ref=hl")!==-1)
        {
            window.location.href=window.location.href.replace(/^(.*)\?ref=hl.*$/,"$1/about/?ref=page_internal");
        }
        else if(window.location.href.indexOf("/about")===-1 && window.location.href.indexOf("/pages/")===-1 &&

               /https?:\/\/www\.facebook\.com\/.+/.test(window.location.href))
        {
            window.location.href=window.location.href.replace(/\/$/,"")+"/about/?ref=page_internal";
        }
        else if( /https?:\/\/www\.facebook\.com\/.+/.test(window.location.href))
        {
            setTimeout(do_fb,2500);
        }
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
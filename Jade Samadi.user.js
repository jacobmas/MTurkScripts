// ==UserScript==
// @name         Jade Samadi
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @connect terida.com
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
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["linkedin.com","yourlifemoments.ca","facebook.com","canada411.ca","411numbers-canada.com","canadapostalcodes.net","/411.ca",
                 "health-local.com","www.psychologytoday.com","yellowpages.ca",".theravive.com","healthcare6.com","canadapages.com","bizapedia.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function check_function()
    {
	return true;
    }

    function check_and_submit2(check_function,automate2)
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
    
    function terida_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log("doc="+doc.body.innerText+"\n");
        console.log("MOO2");
        var i;
      //  console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var name_sec=doc.getElementById("nameSection");
        var emp_name_sec=doc.getElementById("employerNameSection");
        var email_sec=doc.getElementById("emailSection");
        var phone_sec=doc.getElementById("businessPhoneSection");
        var add_sec=doc.getElementById("businessAddressSection");
        var ctrl=document.getElementsByClassName("form-control");
        var table;
        var panel=doc.getElementById("memberInfoPnl");
      /*  if(panel)
        {
            var topic=panel.getElementsByClassName("topic");
            for(i=0; i < topic.length; i++) console.log("("+i+"), "+topic[i].innerText);
        }*/
        let name="";
        if(name_sec)
        {
            table=name_sec.getElementsByTagName("table");
            if(table.length>0)
            {
                for(i=0; i < table[0].rows.length; i++)
                {
                    if(/First/.test(table[0].rows[i].cells[0].innerText)) my_query.first=table[0].rows[i].cells[1].innerText.trim();
                    if(/Last/.test(table[0].rows[i].cells[0].innerText)) my_query.last=table[0].rows[i].cells[1].innerText.trim();

                    if(!/Middle/.test(table[0].rows[i].cells[0].innerText))
                    {
                        name=name+table[0].rows[i].cells[1].innerText.trim()+" ";
                    }
//                    console.log(table[0].rows[i].innerText.trim());
                }
            }
            name=name.trim();
            console.log("Name: "+name);
            my_query.name=name;
        }


        for(i=0; i < ctrl.length; i++) ctrl[i].type="text";

     //   document.getElementsByName("companyName")[0].value=emp_name_sec.getElementsByClassName("public-register-data")[0].innerText;
        if(email_sec!==null && email_sec!==undefined)
        {
            //console.log("email_sec="+email_sec.innerText);
            ctrl[0].value=email_sec.getElementsByClassName("public-register-data")[0].innerText.trim();
        }
        else
        {
            console.log("email_sec="+email_sec);
        }

        if(phone_sec!==null && phone_sec!==undefined)
        {
            ctrl[1].value=phone_sec.getElementsByClassName("public-register-data")[0].innerText.trim();
        }
        if(emp_name_sec)
        {
            ctrl[2].value=emp_name_sec.getElementsByClassName("public-register-data")[0].innerText.trim();
            my_query.employer=emp_name_sec.getElementsByClassName("public-register-data")[0].innerText.trim();
        }
        if(add_sec)
        {
            let address="",temp_text="",temp_label="";
            table=add_sec.getElementsByTagName("table");
            if(table.length>0)
            {
                for(i=0; i < table[0].rows.length; i++)
                {
                    temp_label=table[0].rows[i].cells[0].innerText.trim();
                    temp_text=table[0].rows[i].cells[1].innerText.trim();
                    if(temp_text.length>0 && !/Line 2|Line 3|Country|Zip/.test(temp_label))
                    {
                        address=address+temp_text+",";
                    }
                    if(/^Province/.test(table[0].rows[i].cells[0].innerText))
                    {
                        ctrl[3].value=table[0].rows[i].cells[1].innerText.trim();
                    }
                }
            }
            address=address.replace(/,$/,"");
            my_query.address=address;
            console.log("Address: "+address);
        }
        var success=true;
        for(i=0; i < ctrl.length; i++) { if(ctrl[i].value.length===0) success=false; }
        if(success)
        {
            query_promise_then("");
            return;
        }

        var search_str=my_query.name;
        if(my_query.employer.length>0 && my_query.name.indexOf(my_query.employer.split(" ")[0])===-1)  search_str=search_str+" "+my_query.employer;
      else search_str=search_str+" "+my_query.address;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

        


    }
    function is_bad_email(to_check)
    {
        to_check=to_check.toString().toLowerCase();
        if(to_check.indexOf("@2x.png")!==-1 || to_check.indexOf("@2x.jpg")!==-1) return true;
        else if(to_check.indexOf("s3.amazonaws.com")!==-1) return true;
        else if(/user@example\.com/.test(to_check)) return true;
        if(to_check.indexOf(my_query.first.toLowerCase())!==-1 || to_check.indexOf(my_query.last.toLowerCase())!==-1) return false;
        var split_last=my_query.last.split(/[-\s]+/);
        var i;
        for(i=0; i < split_last.length; i++)
        {
            if(to_check.indexOf(split_last[i].toLowerCase())!==-1) return false;
        }
        return true;
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

     function contact_response(response,resolve,reject,extension) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j;
        var email_val,my_match;
        console.log("in contact response "+response.finalUrl);
        var short_name=response.finalUrl.replace(my_query.url,"");//.replace(/[\/]+/g,"");
        var links=doc.links;
        var email_matches=doc.body.innerHTML.match(email_re);
        var phone_matches=doc.body.innerText.match(phone_re);
         var followed_link=false;
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

        for(i=0; i < links.length; i++)
        {
            if((extension===undefined || extension==='') && !followed_link)
            {
                if(/^(Contact|About)/i.test(links[i].innerText))
                {
                    followed_link=true;
                   // console.log(my_query.url.match(/https?:\/\/[^\/]+/));
                    let new_link=links[i].href.replace(/https?:\/\/[^\/]+/,response.finalUrl.match(/https?:\/\/[^\/]+/));
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
           /* if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
            {
                console.log(short_name+": ("+i+")="+links[i].href); }*/
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
               

                if(email_val.length>0 && !is_bad_email(email_val))
                {
                     console.log("Found emailBlop="+email_val);
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
        }

        if(my_query.email!==undefined && my_query.email.length>0 && !my_query.submitted)
        {
            my_query.submitted=true;
            document.getElementsByClassName("form-control")[0].value=my_query.email;
            check_and_submit2(check_function);
        }



    }

   

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    lgb_info=doc.getElementById("lgb_info");



            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length && i < 4; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                if(is_bad_url(b_url,bad_urls,-1)) continue;

                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);



               if(!is_bad_url(b_url, bad_urls,-1) )
                {
                    b1_success=true;
		    break;

                }

            }
	    if(b1_success)
	    {
		/* Do shit */
		GM_xmlhttpRequest({method: 'GET', url: b_url,
            onload: function(response) { contact_response(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
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
	resolve("Nothing found");
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
    function query_promise_then(result) {
        check_and_submit2(check_function,true);

    }






    function init_Query()
    {

        my_query={name:"",address:"",employer:"",submitted:false,email:""};
       var url=document.getElementsByClassName("dont-break-out")[0].href;

        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             terida_response(response);
            },
            onerror: function(response) { console.log("FAil"); },
            ontimeout: function(response) { console.log("Fail"); }


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
    else if(window.location.href.indexOf("worker.mturk.com")!==-1)
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
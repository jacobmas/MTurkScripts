// ==UserScript==
// @name         Christopher Diaz
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
        if(b_name.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1) return false;
        return true;
//	return false;

    }

    function fix_phone(phone_match2)
    {
        var phone_str="";
        phone_match2=phone_match2.trim();
        if(phone_match2.length===11 && phone_match2.charAt(0)==="1") { phone_match2=phone_match2.substr(1); }
        if(phone_match2.length===10)
        {
            phone_str="("+phone_match2.substr(0,3)+") "+phone_match2.substr(3,3)+"-"+phone_match2.substr(6,4);
        }
        if(phone_str==="") phone_str=phone_match2;
        return phone_str;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a, phone_match1,phone_match2;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption, b_context,b_ans, b_vlist;
        var b1_success=false, b_header_search, inner_li, doneState=false, donePhone=false,cbl,phone_str;
        var llc_cont,match,add,state_str;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            b_context=doc.getElementById("b_context");
            llc_cont=doc.getElementsByClassName("llc_cont");
            if(response.finalUrl.indexOf("yellowpages") === -1 && b_context!==null)
            {
                b_ans=b_context.getElementsByClassName("b_ans")[0];
                if(b_ans!==undefined)
                {
                    b_vlist=b_ans.getElementsByClassName("b_vList");
                    if(b_vlist.length>0)
                    {
                        inner_li=b_vlist[0].getElementsByTagName("li");
                        for(i=0; i < inner_li.length; i++)
                        {
                            console.log("inner_li["+i+"].innerText="+inner_li[i].innerText);

                            if(/Address: (.*)$/.test(inner_li[i].innerText))
                            {
                                console.log("Found address");
                                match=inner_li[i].innerText.match(/Address: (.*)/);
                                add=parseAddress.parseLocation(match[1]);
                                if(add.state!==undefined)
                                {
                                    doneState=true;
                                    document.getElementsByName("state")[0].value=add.state;
                                }
                            }
                            else if(/Phone: (.*)$/.test(inner_li[i].innerText))
                            {
                                console.log("Found phone");

                                phone_str="";
                                phone_match1=inner_li[i].innerText.match(/Phone: (.*)$/);
                                if(/\(\d{3}\)\s\d{3}\-\d{4}/.test(phone_match1[1]))
                                {
                                    phone_str=phone_match1[1];
                                }
                                else {
                                    phone_match2=phone_match1[1].replace(/[^\d]/g,"");
                                    phone_str=fix_phone(phone_match2);
                                }
                                if(/\(\d{3}\)\s\d{3}\-\d{4}/.test(phone_str))
                                {
                                    document.getElementsByName("phone")[0].value=phone_str;
                                    donePhone=true;
                                }

                            }
                            else if(/Headquarters: (.*)$/.test(inner_li[i].innerText))
                            {
                                var headmatch=inner_li[i].innerText.match(/Headquarters: (.*)$/);
                                var headplace=headmatch[1].split(",");
                                if(headplace.length>1 && /^[A-Z]{1}[a-z]{1}/.test(headplace[headplace.length-1].trim()))
                                {
                                    document.getElementsByName("phone")[0].value="OOT";
                                    document.getElementsByName("state")[0].value="OOT";
                                    donePhone=true;
                                    doneState=true;
                                }
                            }


                        }

                    }
                }
            }
            if(response.finalUrl.indexOf("yellowpages")===-1 && !(donePhone && doneState) && llc_cont.length>0)
            {
                b_factrow=llc_cont[0].getElementsByClassName("b_factrow");
                if(b_factrow.length>=2)
                {
                    var temp1=b_factrow[1].innerText.split(" · ");
                    if(temp1.length>1)
                    {
                        phone_str=fix_phone(temp1[1]);
                        add=parseAddress.parseLocation(temp1[0]);


                        if(add.state!==undefined)
                        {
                            doneState=true;
                            document.getElementsByName("state")[0].value=add.state;
                        }
                        if(/\(\d{3}\)\s\d{3}\-\d{4}/.test(phone_str))
                        {
                            document.getElementsByName("phone")[0].value=phone_str;
                            donePhone=true;
                        }
                    }
                }
            }
            if(donePhone && doneState)
            {
                console.log("Done with both");
                check_and_submit(check_function,automate);
                return;
            }
            else if(response.finalUrl.indexOf("yellowpages")!==-1)
            {

                console.log("b_algo.length="+b_algo.length);

           
                for(i=0; i < b_algo.length && i < 1; i++)
                {
                    b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                    b_url=b_algo[i].getElementsByTagName("a")[0].href;
                    b_caption=b_algo[i].getElementsByClassName("b_caption");

                    if(!is_bad_name(b_name))
                    {
                        b1_success=true;
                        break;

                    }

                }
                if(b1_success)
                {
                    resolve(b_url);
                    return;
                    // Do shit
                }
            }


        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
         var search_str;
        if(my_query.queryCount===0)
        {
            my_query.queryCount++;
            search_str=my_query.name+" company";
            query_search(search_str, resolve, reject, query_response);
            return;
        }
        else if(my_query.queryCount===1)
        {
            my_query.queryCount++;
            search_str=my_query.name+" LLC";
            query_search(search_str, resolve, reject, query_response);
            return;
        }
        else if(my_query.queryCount===2)
        {
            my_query.queryCount++;
            search_str=my_query.name;
            query_search(search_str, resolve, reject, query_response);
            return;
        }
        else if(my_query.queryCount===3)
        {
            my_query.queryCount++;
            search_str=my_query.name+" address";
            query_search(search_str, resolve, reject, query_response);
            return;
        }

        else if(my_query.queryCount===4)
        {
            my_query.queryCount++;
            search_str=my_query.name+" solar site:yellowpages.com";
            query_search(search_str, resolve, reject, query_response);
            return;
        }
        else
        {
            reject("Nothing found");
        }
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
    function query_promise_then(url) {
        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             parse_yellowpages(response);
            },
            onerror: function(response) { console.log("Fail"); GM_setValue("returnHit",true); },
            ontimeout: function(response) { console.log("Fail"); GM_setValue("returnHit",true); }


            });

    }

    function parse_yellowpages(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var address=doc.getElementsByClassName("address");
        var phone=doc.getElementsByClassName("phone");
        var doneState=false,donePhone=false;
        var add;
        console.log("In Yellowpages");
        if(address.length>0)
        {
            add=parseAddress.parseLocation(address[0].innerText);

            if(add.state!==undefined)
            {
                doneState=true;
                document.getElementsByName("state")[0].value=add.state;
            }
        }
        if(phone.length>0)
        {
            var phone_str=fix_phone(phone[0].innerText);

            if(/\(\d{3}\)\s\d{3}\-\d{4}/.test(phone_str))
            {
                document.getElementsByName("phone")[0].value=phone_str;
                donePhone=true;
            }
        }
        if(donePhone && doneState)
        {
            check_and_submit(check_function,automate);
        }
        else
        {
            console.log("Failed yellowpages");
            GM_setValue("returnHit",true);
        }

    }





    function init_Query()
    {

       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:wT.rows[0].cells[1].innerText.replace(/ LLC$/,"").replace(/ Inc\.?$/,"").replace(/ Company$/i,"").replace(/Corp\.?/i,""), queryCount:0};

	var search_str=my_query.name+" solar";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });





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
// ==UserScript==
// @name         RichGentry
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about JJNissen
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
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect sec.gov
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// ==/UserScript==

(function() {
    'use strict';

    var my_query={};

    function set_unusual(is_unusual)
    {
        var inps=document.getElementsByTagName("input");
        var i;
        var rad_count=0;
        for(i=0; i < inps.length; i++)
        {
            if(inps[i].type==="radio")
            {
                if((rad_count==0 && is_unusual) || (rad_count==1 && !is_unusual)) inps[i].checked=true;
                rad_count++;
            }
        }
    }

    function check_and_submit()
    {

       // setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);
        
    }
    function find_proxy(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log("doc.body="+doc.body.innerHTML);

        var the_table=doc.getElementsByClassName("tableFile2");
        if(the_table===undefined || the_table.length===0)
            the_table=doc.getElementsByClassName("tableFile");
       // console.log("the_table[0].innerHTML="+the_table[0].innerHTML);
        var my_link=the_table[0].rows[1].cells[1].firstChild;
       // console.log(my_link.href);
        //.firstChild;
        var url="";
        if(my_link.href!==undefined)
        {
            url=my_link.href.toString().replace("https://s3.amazonaws.com","https://www.sec.gov");
           // my_query.url=url;
            console.log("url="+url);
        }
        else {
            console.log("Failed to find url in proxy1");
            GM_setValue("returnHit",true);
            return;
        }


        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
                find_proxy2(response);
            //    bing1_response(response, my_query);

            }

        });
    }
    function find_proxy2(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log("doc.body="+doc.body.innerHTML);

        var the_table=doc.getElementsByClassName("tableFile");
        if(the_table===undefined || the_table.length===0)
            the_table=doc.getElementsByClassName("tableFile2");
        //console.log("the_table[0].innerHTML="+the_table[0].innerHTML);
        var my_link=the_table[0].rows[1].cells[2].firstChild;
       // console.log(my_link.href);
        //.firstChild;
        var url="";
        if(my_link.href!==undefined)
        {
            url=my_link.href.toString().replace("https://s3.amazonaws.com","https://www.sec.gov");
            my_query.url=url;
            console.log("url="+url);
        }
        else {
            console.log("Failed to find url in proxy1");
            GM_setValue("returnHit",true);
            return;
        }


        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
                parse_proxy(response);
            //    bing1_response(response, my_query);

            }

        });
    }
     function parse_proxy(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        // console.log("doc.body.innerText="+doc.body.innerText);
         var fiscal_re=new RegExp("fiscal year "+my_query.fy,'i');

         var fiscal_re_match=doc.body.innerText.match(fiscal_re);
         var fiscal_ended_re=/fiscal\s+year\s+ended\s+([\w]+)\s+(\d{1,2}),\s*(\d{4})/i;
         //console.log("fiscal_ended_re="+fiscal_ended_re);
         var fiscal_re_ended_match=doc.body.innerText.match(fiscal_ended_re);
         if(fiscal_re_ended_match!==null && fiscal_re_ended_match.length>3)
         {
             my_query.end_month=fiscal_re_ended_match[1];
             my_query.end_day=fiscal_re_ended_match[2];

             my_query.end_year=fiscal_re_ended_match[3];
             console.log(fiscal_re_ended_match[0]);
         }
         else
         {
             console.log("No match");
         }


         if(fiscal_re_match===null && fiscal_re_ended_match===null)
         {
             set_unusual(true);
         }
         else if(!((my_query.end_month==="December" && my_query.end_year===my_query.fy) ||
                 (my_query.end_month==="March" && parseInt(my_query.end_year)-1===parseInt(my_query.fy)))
                )
         {
             set_unusual(true);
         }


         document.getElementsByName("mytextbox")[0].value=my_query.url;

         console.log("Doing my_query.annual="+my_query.annual);

         GM_xmlhttpRequest({
            method: 'GET',
            url:    my_query.annual,

            onload: function(response) {
                find_annual(response);
            //    bing1_response(response, my_query);

            }

        });
     }
    function find_annual(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log("doc.body="+doc.body.innerHTML);

        var the_table=doc.getElementsByClassName("tableFile2");
        if(the_table===undefined || the_table.length===0)
            the_table=doc.getElementsByClassName("tableFile");
       //console.log("the_table[0].innerHTML="+the_table[0].innerHTML);
        var i;
        for(i=0; i < the_table[0].rows.length; i++)
        {
            console.log("the_table[0].rows["+i+"].cells[0]="+the_table[0].rows[i].cells[0].innerText);
            if(the_table[0].rows[i].cells[0].innerText==="10-K" || the_table[0].rows[i].cells[0].innerText==="10-K405")
            {
                var my_link=the_table[0].rows[i].cells[1].firstChild;
                // console.log(my_link.href);
                //.firstChild;
                var url="";
                if(my_link.href!==undefined)
                {
                    url=my_link.href.toString().replace("https://s3.amazonaws.com","https://www.sec.gov");
                    // my_query.url=url;
                    console.log("url="+url);
                }
                else {
                    console.log("Failed to find url in annual1");
                    GM_setValue("returnHit",true);
                    return;
                }


                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    url,

                    onload: function(response) {
                        find_annual2(response);
                        //    bing1_response(response, my_query);

                    }

                });

                return;
            }
        }

        GM_setValue("returnHit",true);

    }
    function find_annual2(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log("doc.body="+doc.body.innerHTML);

        var the_table=doc.getElementsByClassName("tableFile");
        if(the_table===undefined || the_table.length===0)
            the_table=doc.getElementsByClassName("tableFile2");
        //console.log("the_table[0].innerHTML="+the_table[0].innerHTML);
        var my_link=the_table[0].rows[1].cells[2].firstChild;
       // console.log(my_link.href);
        //.firstChild;
        var url="";
        if(my_link.href!==undefined)
        {
            url=my_link.href.toString().replace("https://s3.amazonaws.com","https://www.sec.gov");
            my_query.annual_url=url;
            console.log("url="+url);
        }
        else {
            console.log("Failed to find url in annual2");
            GM_setValue("returnHit",true);
            return;
        }


        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
                parse_annual(response);
            //    bing1_response(response, my_query);

            }

        });
    }
   function parse_annual(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("doc.body.innerText="+doc.body.innerText);

         var fiscal_ended_re=new RegExp("fiscal year ended "+my_query.end_month+"[^\w]"+my_query.end_day+",[^\w]"+my_query.end_year);
         console.log("fiscal_ended_re="+fiscal_ended_re);
         var fiscal_re_ended_match=doc.body.innerText.match(fiscal_ended_re);


         if(fiscal_re_ended_match===null)
         {
             console.log("match null in annual");
             set_unusual(true);
         }
       else
       {
           console.log("matched ended in annual");
       }



         document.getElementsByName("citation")[0].value=my_query.annual_url;



         check_and_submit();

     }

    function init_RichGentry()
    {

        var proxy=document.links[1].href;
        var annual=document.links[2].href;

        var my_re=/You are looking for fiscal year: (\d{4})/;
        var my_match=document.getElementById("mturk_form").innerText.match(my_re);
        my_query.fy="0000";
        if(my_match!==null && my_match.length>1) my_query.fy=my_match[1];
        else { console.log("Failed to match"); GM_setValue("returnHit",true); }
        my_query.proxy=proxy;
        my_query.annual=annual;
             document.getElementsByName("question1")[0].value="No";
        set_unusual(false);
        console.log("my_query.fy="+my_query.fy);

        GM_xmlhttpRequest({
            method: 'GET',
            url:    proxy,

            onload: function(response) {
                find_proxy(response);
            //    bing1_response(response, my_query);

            }

        });

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
        if(!submitButton.disabled || true)
        {
            
            init_RichGentry();
        }

    }
    else
    {
        //setTimeout(function() { btns_secondary[0].click(); }, 40000);
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {

                  // btns_secondary[0].click();
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
         // btns_primary[0].click();
        }
        else
        {
            /* Wait to return the hit */
            console.log("MOO");
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            //if(cbox.checked===false) cbox.click();
        }

    }


})();
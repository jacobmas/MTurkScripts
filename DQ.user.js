// ==UserScript==
// @name         DQ
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about JJNissen
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/3Z4CV11E5DFBY1JRP9H7AZJUZDHFC6/*
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

// ==/UserScript==

(function() {
    var email_re = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;
    var url_re=/https?:\/\/[^\/]*\/?/;
    var my_query={};
    var dealer_props={"waynereaves.com": {"url": "/inventory", "parser": parse_waynereaves, "openTab": true, "timeOut": 5000},
                     "www.dealerwebsites.com": {"url": "inventory/CurrentPage=1,VehicleCategory=0,Make=,VehicleModel=,Stock=,MinPrice=,MaxPrice=,MinYear=0,MaxYear=0,Sort=Make,Type=,Mileage=,pageSize=1000",
                                        "parser": parse_dealerwebsites},
                      "www.carsforsale.com": {"url": "/inventory.aspx?sold=0", "parser": parse_carsforsale1},
                      "www.autocorner.com": {"url": "/cat_pages/inventory_1.shtml",
                                     "parser": parse_autocorner},
                      "http://www.autosearchtech.com/": {"url": "autos.php",
                                                         "parser": parse_autosearchtech},
                      "www.automanager.com": {"url": "/view-inventory",
                                      "parser": parse_automanager},
                      "https://www.dealeron.com?utm_source=dealersite&amp;utm_medium=referral&amp;utm_campaign=Client_Sites":
                      {"url": "/searchused.aspx", "parser": parse_dealeron },
                      "http://www.functionone.com/": {"url": "/VehicleInventory.aspx", "parser": parse_functionone},
                      "ebizautos.com": {"url": "/used-cars.aspx",
                "parser":parse_ebizautos},
                      "www.dealercarsearch.com": {"url":"/newandusedcars.aspx?clearall=1",
                      "parser":parse_dealercarsearch},
                      "www.v12software.com": {"url":"/inventory", "parser":parse_v12software}
                     };


    function is_good(elem)
    {
        return elem !== undefined && elem.length>0;
    }
    function is_bad_email(to_check)
    {
        return false;
    }
    function bad_website()
    {
        document.getElementById("websiteUnavailable").checked=true;
        submit_hit();

    }
    function submit_hit()
    {
        setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);
    }

    function is_bad_website(url)
    {
        var slash_split=url.split("/");
        var len=slash_split.length;
        if(len>0 && slash_split[len-1]==="UnusedDomains.htm") return true;
        if(url.indexOf("autocorner.com")!==-1 && my_query.url.indexOf("autocorner.com")===-1) return true;
        return false;
    }

    function parse_website(response)
    {
        var x, y;
        /*for(x in response)
            console.log("response["+x+"]="+response[x]);*/

        if(is_bad_website(response.finalUrl))
        {
            bad_website();
            return;
        }
        console.time();
        console.log("Beginning parse");

        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var scriptList = doc.scripts;
        var linkList=doc.links;
        var emailMatches="";//bodyText.match(email_re);
        var found_email=false;
        var found_site=false;
        var curr_href;
        var site_promise;
        var name_promise;
        site_promise=new Promise((resolve,reject) => {
            for(x=0; x < scriptList.length; x++)
            {

                if(scriptList[x].src.indexOf("/lawaitlakjhngozb.js")!==-1 ||
                   scriptList[x].src.indexOf("/yihvdznekzjgcedl.js") !==-1)
                {
                    console.log("found carsforsale0, pausing for 10 second");
                    my_query.dealer_name="www.carsforsale.com";
                    GM_openInTab(my_query.url);
                    found_site=true;
                    setTimeout(function() { do_dealersearch(my_query.dealer_name,resolve,reject); },6500);
                    //do_carsforsalesearch1();

                }
                //console.log("scriptList["+x+"].src="+scriptList[x].src);
            }

            for(x=0; x < linkList.length; x++)
            {
                curr_href=linkList[x].href;
                console.log("curr_href="+curr_href);
                if(linkList[x].href.indexOf("mailto")!==-1)
                {
                    emailMatches=linkList[x].href.match(email_re);
                    if(emailMatches !== null && emailMatches.length>0&& !is_bad_email(emailMatches[0]))
                    {
                        found_email=true;
                        document.getElementById("email").value=emailMatches[0];
                    }
                }
                for(y in dealer_props)
                {
                    if(!found_site && curr_href.indexOf(y)!==-1)
                    {
                        found_site=true;
                        console.log("Found "+y);
                        my_query.dealer_name=y;
                        setTimeout(function() { do_dealersearch(my_query.dealer_name,resolve,reject);  }, 2000);
                    }
                }



            }
            console.log("Done loops");
        });
        ///var bodyText=doc.body.innerHTML.toString();
        console.log("Ending parse: ");
        console.timeEnd();
        console.log(doc.head);
        console.log(doc.body);

        name_promise = new Promise((resolve,reject) => {
            if(found_email) {
                console.log("Found email");
                /* Get name from manta */
                var search_url=my_query.url.replace(/www\./,"").replace(/https?:\/\//,"");
                console.log("stripped search url for manta is "+search_url);
                var search_str=search_url+" site:manta.com";
                var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    search_URI,

                    onload: function(response) {

                        get_manta_response(response,resolve,reject); }

                });
            }
            else
            {
                console.log("No email");
                reject("No email");
            }
        });

            name_promise.then((message) => {
                var count_tries=0;
                if(typeof site_promise==="undefined")
                {
                    console.log("setting timeout with email");
                    setTimeout(function() {

                        if(typeof site_promise==="undefined") {
                            console.log("Site type undefined");
                            GM_setValue("returnHit",true);
                        }
                        else
                        {
                            console.log("Site promise exists");
                            site_promise.then((message) => { submit_hit(); })
                                .catch((message) => {  GM_setValue("returnHit",true); });
                        }


                    },5000);
                }
                else
                {
                    site_promise.then((message) => { submit_hit(); })
                        .catch((message) => {  GM_setValue("returnHit",true); });
                }
            })
                .catch((message) => {
                if(typeof site_promise==="undefined")
                {
                    console.log("setting timeout no email");
                    setTimeout(function() {

                        if(typeof site_promise==="undefined") {
                            console.log("Site type undefined");
                            GM_setValue("returnHit",true);
                        }
                        else
                        {
                            console.log("Site promise exists");
                            site_promise.then((message) => { submit_hit(); })
                                .catch((message) => {  GM_setValue("returnHit",true); });
                        }


                    },5000);
                }
                else
                {
                    site_promise.then((message) => { submit_hit(); })
                        .catch((message) => {  GM_setValue("returnHit",true); });
                }
            });

        console.log("MOOOTOO");
        var content_head=document.getElementById("content-head");
        //console.log(content_head.innerText);
        if(content_head!==null && content_head.innerText.substr(0,5)==="Oops,")
        {   bad_website(); return;  }
    }
    function returnHitFunc(response) {
        GM_setValue("returnHit",true); }

    /* Less code repeats, do each dealer separately) num times called */
    function do_dealersearch(dealer_name, resolve,reject)
    {
        var ret;
        console.log("Doing dealer search for "+ dealer_name);
        var url=my_query.url+dealer_props[dealer_name].url;

        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,
            //synchronous: true,
            onerror: returnHitFunc, onabort: returnHitFunc, ontimeout: returnHitFunc,
            onload: function(response) {

                var doc = new DOMParser()
                .parseFromString(response.responseText, "text/html");
                console.log("Parsing result for "+dealer_name);
                console.log(doc.head);
                console.log(doc.body);
                ret=dealer_props[dealer_name].parser(doc);
                if(ret)
                {
                    console.log("ret=true");
                    resolve("SUCCESS");
                    //submit_hit();
                }
                else
                {
                    reject("FAIL");
                }

            }
        });
    }
    function parse_autosearchtech(doc)
    {
        var tcell=doc.getElementsByClassName("te_paging_middle_cell");
         var dealer_re=/^\d+/;
        if(tcell !== undefined && tcell.length>0)
        {
            var my_match=tcell[0].innerText.match(dealer_re);
            if(my_match !== null && my_match.length>0)
            {
                document.getElementById("websiteVINCount").value=my_match[0];
                return true;
            }
        }
        return false;

    }

    function parse_waynereaves(doc)
    {
        var counts=doc.getElementsByClassName("count");
        var tot_count=0;
        var i;
        var curr_text;
        if(counts!==undefined && counts.length>0)
        {
            for(i=0; i < counts.length; i++)
            {
                curr_text=counts[i].innerText;
                tot_count=tot_count+parseInt(curr_text.substr(1,curr_text.length-2));
            }
            document.getElementById("websiteVINCount").value=tot_count;

            return true;

        }
        return false;
    }
    function parse_v12software(doc)
    {
        var counts=doc.getElementsByClassName("count");
        var tot_count=0;
        var i;
        var curr_text;
        if(counts!==undefined && counts.length>0)
        {
            for(i=0; i < counts.length; i++)
            {
                curr_text=counts[i].innerText;
                tot_count=tot_count+parseInt(curr_text.substr(1,curr_text.length-2));
            }
            document.getElementById("websiteVINCount").value=tot_count;

            return true;

        }
        return false;
    }
    function parse_autocorner(doc)
    {
        var makesblock=doc.getElementsByClassName("InvList-MakesBlock");
        var tot_count=0;
        var i;
       var dealer_re=/\((\d+)\)/;

        var curr_text;
        if(makesblock!==undefined && makesblock.length>0)
        {
            var amakes=makesblock[0].getElementsByTagName("a");

            for(i=0; i < amakes.length; i++)
            {
                curr_text=amakes[i].innerText;
                match_re=curr_text.match(dealer_re);
                if(match_re!==null && match_re.length>1)
                    tot_count=tot_count+parseInt(match_re[1]);
            }
            document.getElementById("websiteVINCount").value=tot_count;

            return true;

        }
        return false;
    }
    function parse_dealeron(doc)
    {
        var dealer_re, my_match;
        var to_check=doc.getElementsByClassName("srpVehicleCount");
        if(to_check!==undefined && to_check.length>0)
        {
            dealer_re=/(\d+) Vehicles/;
            match_re=to_check[0].match(dealer_re);
            if(match_re!==null && match_re.length>1)
            {
                document.getElementById("websiteVINCount").value=match_re[1];
                return true;
            }
        }
        return false;
    }
    function parse_ebizautos(doc)
    {
        var dealer_re, my_match;
        var page_title=doc.getElementById("page-title");
        if(page_title!==undefined)
        {
            var h1=page_title.getElementsByTagName("h1");
            if(h1!==null && h1!==undefined && h1.length>0)
            {
                var to_check=h1.innerText;

                if(to_check!==undefined && to_check.length>0)
                {
                    dealer_re=/(\d+) Vehicles/;
                    match_re=to_check[0].match(dealer_re);
                    if(match_re!==null && match_re.length>1)
                    {
                        document.getElementById("websiteVINCount").value=match_re[1];
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function parse_dealerwebsites(doc)
    {
        var inventory_item=doc.getElementsByClassName("inventory-item");
        if(inventory_item!==undefined && inventory_item.length>=0) {
            document.getElementById("websiteVINCount").value=inventory_item.length;
            return true;
        }
        return false;
    }
    function parse_carsforsale1(doc)
    {

        var lblVehicleCount=doc.getElementById("ctl00_cphBody_inv1_lblVehicleCount");
        var dealer_re, match_re;
        if(lblVehicleCount!==null)
        {
            console.log("\tcarsforsale type 1");
            var to_check=lblVehicleCount.innerText;
            dealer_re=/(\d+) vehicles found/;
            match_re=to_check.match(dealer_re);
            if(match_re !== null && match_re.length>1)
            {
                document.getElementById("websiteVINCount").value=match_re[1];
                return true;
            }


        }
        else
        {
            console.log("\tnot carsforsale type 1");
            var section_title=doc.getElementsByClassName("inventory-breadcrumb");
            console.log("section_title="+section_title[0]);
            if(section_title!==null && section_title!==undefined && section_title.length>0)
            {
                console.log("\tcarsforsale type 2");
                dealer_re=/(\d+) R/;
                match_re=section_title[0].innerText.match(dealer_re);
                if(match_re !== null && match_re.length>1)
                {
                    document.getElementById("websiteVINCount").value=match_re[1];

                    return true;
                }
            }


        }

        return false;
    }

    function parse_dealercarsearch(doc)
    {
        var dxp_lead=doc.getElementsByClassName("dxp-lead");
        if(dxp_lead!==undefined && dxp_lead.length>0)
        {
            var to_check=dxp_lead[0].innerText;
            var dealer_re=/\((\d+) vehicles?\)/;
            var match_re=to_check.match(dealer_re);
            if(match_re !== null && match_re.length>1)
            {
                document.getElementById("websiteVINCount").value=match_re[1];
                return;
            }
        }
    }

    function parse_functionone(doc)
    {
        var to_check=document.getElementsByClassName("ob_gFRP");
        var dealer_re, match_re;
        if(to_check!==null && to_check.length>0)
        {
            dealer_re=/of (\d+)/;
            match_re=to_check[0].match(dealer_re);

            if(match_re !== null && match_re.length>1)
            {
                document.getElementById("websiteVINCount").value=match_re[1];
                return true;
            }
        }
        return false;
    }
    function parse_automanager(doc)
    {
        var vehiclesfoundheader=doc.getElementById("vehicles-found-header");
        if(vehiclesfoundheader!==null)
        {
            console.log(vehiclesfoundheader.innerText);
            var to_check=vehiclesfoundheader.innerText;
            var dealer_re=/(\d+) Vehicles Found/;
            var match_re=to_check.match(dealer_re);
            console.log(match_re);
            if(match_re !== null && match_re.length>1)
            {
                document.getElementById("websiteVINCount").value=match_re[1];
                return true;
            }
        }
        else
        {
            vehiclesfoundheader=doc.getElementsByClassName("vehicles-found-header");
            if(vehiclesfoundheader!==null && vehiclesfoundheader.length>0)
            {
                console.log(vehiclesfoundheader[0].innerText);
                var to_check1=vehiclesfoundheader[0].innerText;
                var dealer_re1=/(\d+)/;
                var match_re1=to_check1.match(dealer_re1);
                console.log(match_re1);
                if(match_re1 !== null && match_re1.length>1)
                {
                    document.getElementById("websiteVINCount").value=match_re1[1];

                    return true;
                }
            }
        }
        return false;
    }

    /* Find name via manta */
    function get_manta_response(response,resolve, reject) {
        // console.log(JSON.stringify(response));
        let doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("search");

        var g_stuff=search.getElementsByClassName("g");
        var i;
        var g1_success=false;
        var t_url="", t_header_search="";

        try
        {
            t_url=g_stuff[0].getElementsByTagName("a")[0].href; // url of query
        }
        catch(error)
        {
            /* Can't find on google */
            console.log("ERROR");
            reject("ERROR");

        }
        console.log("t_url="+t_url);
        GM_xmlhttpRequest({
            method: 'GET',
            url:    t_url,

            onload: function(response) {
                let doc = new DOMParser()
                .parseFromString(response.responseText, "text/html");
                console.log("doc.body="+doc.body.innerHTML.toString());
                try
                {
                    var contact=doc.getElementsByClassName("m180");
                    console.log("contact[0]="+contact[0]);
                    var list_unstyled=contact[0].getElementsByClassName("list-unstyled")[0];
                    console.log(list_unstyled.innerText);
                    var name_span=list_unstyled.getElementsByTagName("span")[0];
                    var the_name=name_span.innerText;
                    var name_split=the_name.split(" ");
                    let name_split_len=name_split.length;
                    var fname, lname="";
                    fname=name_split[0];
                    if(name_split_len>=2)
                    {
                        if(name_split>=3 &&
                           (name_split[name_split_len-1].indexOf("Jr")!==-1 || name_split[name_split_len-1].indexOf("III")!==-1)
                           )
                            lname=name_split[name_split_len-2];
                        else
                            lname=name_split[name_split_len-1];
                    }
                    document.getElementById("firstName").value=fname;
                    document.getElementById("lastTitle").value=lname;
                    resolve("Success");

                }
                catch(error) {
                    console.log("Error="+error);
                    reject("Error");
                }

            }

        });


    }

    function init_DQ()
    {
        var temp_url=document.getElementsByClassName("dont-break-out")[0].href;
        temp_url=temp_url.replace("https://www.mturkcontent.com/dynamic/","http://");

        var url_match=temp_url.match(url_re);
        var url="";
        var wells=document.getElementsByClassName("well");
        my_query.dealer_name=wells[1].innerText;
        if(url_match !== undefined && url_match.length > 0)
        {
            url=url_match[0].replace(/\/$/,"");
        }
        else
        {
            console.log("URL FAIL");
            return;
        }

        my_query.url=url;
        GM_setClipboard(my_query.url);
        console.log("url="+url);


        GM_xmlhttpRequest({
                method: 'GET',
                url:    url,
                onerror: function(response) {
                    bad_website();

                },
                onabort: function(response) {
                    bad_website();
                    return;



                },
                ontimeout: function(response) {
                    bad_website();

                },
                onload: function(response) {
                    parse_website(response);
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
        if(!submitButton.disabled )
        {
           
            init_DQ();
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
          //btns_primary[0].click();
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
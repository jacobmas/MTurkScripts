// ==UserScript==
// @name         FindBusiness
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find Business Stuff
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://*facebook.com/*
// @include https://*facebook.com*
// @include https://worker.mturk.com/*
// @include https://www.bing.com/maps*
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
    var bad_urls=["manta.com","hoovers.com","ontheradio.net","en.wikipedia.org"];
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
    function is_bad_name(b_name,i)
    {
        console.log("b_name.toLowerCase()="+b_name.toLowerCase()+", my_querystuff="+my_query.short_name.split(/[-\+\s]+/)[0].toLowerCase());
        if(b_name.toLowerCase().indexOf(my_query.short_name.split(/[-\+\s]+/)[0].toLowerCase())!==-1
          || my_query.name.toLowerCase().indexOf(b_name.split(/[-\+\s]+/)[0].toLowerCase())!==-1
          )
        {
            return false;
        }
        return true;
//        return false;
    }

    function is_bad_url2(the_url)
    {
        var the_split=the_url.split("/");

        if(the_split.length<=3) return false;
         if(the_split[3].indexOf("?")!==-1) return true;
        var dash_split=the_split[3].split("-");

        if(dash_split.length>2) return true;
        var und_split=the_split[3].split("_");
        if(und_split.length>2) return true;
        return false;
    }
    function query_response(response,resolve,reject,pos) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response for "+my_query.sites[pos].domain+"\n"+response.finalUrl);
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
                b_url=b_url.replace(/\/$/,"");
                console.log("b_url="+b_url+"\tb_name="+b_name);


                if(!is_bad_url(b_url, bad_urls,-1) && !is_bad_name(b_name,i))
                {
                    b1_success=true;
                    break;
                }
                
            }
	    if(b1_success)
	    {
            if(my_query.sites[pos].domain==="facebook.com")
            {
                call_facebook(b_url,resolve,reject,i);
            }
            else
            {
                GM_xmlhttpRequest({method: 'GET', url: b_url,
                               onload: function(response) { my_query.sites[pos].parser(response,resolve,reject); },
                               onerror: function(response) { reject("Fail"); },
                               ontimeout: function(response) { reject("Fail"); }
                              });
            }
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

    function query_search(search_str, resolve,reject, callback,i) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             callback(response, resolve, reject,i);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {    }

    /* After resolving on FB; i is position of facebook in sites */
    function call_facebook(url,resolve,reject,i) {
        console.log("In call_facebook for "+url);
        GM_setValue("fb_result","");
        GM_addValueChangeListener("fb_result", function() {
            var result=arguments[2];

            console.log("fb_result="+JSON.stringify(result));
            if(result.url.length>0)
            {
                my_query.company_url=result.url;
            }
            if(result.address.length>0)
            {

                var bing_url="https://www.bing.com/maps?q="+result.address.replace(/\s/g,"+");
                console.log("bing_url="+bing_url);
                GM_setValue("bingmaps_result","");
                GM_addValueChangeListener("bingmaps_result", function() {
                    var result=arguments[2];
                    console.log("bingmaps_result="+JSON.stringify(result));
                    business_parse_address(arguments[2].address);
                    add_to_sheet();


                });
                GM_setValue("bingmaps_url",bing_url);
            }
            if(result.phone.length>0) my_query.company_phone=result.phone;
            add_to_sheet();





        });
        GM_setValue("fb_url",url);

    }

    function business_parse_address(address)
    {
        console.log("In business_parse_address with "+address);
        address=address.replace(/,\s+/g,",");
        var split_add=address.split(",");
        var len=split_add.length,country="";
        var curr_pos=len-1;
        console.log("split_add="+JSON.stringify(split_add));
        if(!/[\d]+/.test(split_add[curr_pos])) { my_query.company_country=split_add[curr_pos].trim(); curr_pos--; }
        else my_query.company_country="United States";
        if(/[\d]+$/.test(split_add[curr_pos])) {
            my_query.company_zip=split_add[curr_pos].match(/[\d]+$/)[0].trim();
            split_add[curr_pos]=split_add[curr_pos].replace(/\s*[\d]+$/,"");
        }
        console.log("my_query="+JSON.stringify(my_query));
        if(split_add[curr_pos].length>0)
        {
            my_query.company_stateOrRegion=split_add[curr_pos].trim();
            curr_pos--;
        }
        if(curr_pos>=0)
        {
            my_query.company_city=split_add[curr_pos--].trim();
        }
        if(curr_pos>=0)
        {
            var j;
            for(j=0; j <= curr_pos; j++)
            {
                my_query.company_addressLine1=my_query.company_addressLine1+split_add[j]+",";
            }
            my_query.company_addressLine1=my_query.company_addressLine1.replace(/,$/,"").trim();
        }

    }


    /** Parse bizapedia for company info, needs fixing!! **/
    function parse_bizapedia(response,resolve,reject)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
      //  console.log("in parse_bizapedia for +\n"+response.finalUrl);
        var text_cells=doc.getElementsByClassName("groupbox_large_break_text");
        var i;
        for(i=0; i < text_cells.length; i++)
        {
            if(text_cells[i].parentNode.cells!==undefined && text_cells[i].parentNode.cells.length>0)
            {
                let label=text_cells[i].parentNode.cells[0].innerText;
                console.log("("+i+"), label="+label);
                if(/Registered Agent/.test(label)) { my_query.company_owner=text_cells[i].innerText.trim().replace(/\n.*$/,"").replace(/\n.*$/,"");
                                                   }
                if(/Address/.test(label)) { my_query.company_address=text_cells[i].innerText; }
            }

        }

        add_to_sheet();


    }

    function parse_yellowpages(response,resolve,reject)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_yellowpages for +\n"+response.finalUrl);


        add_to_sheet();


    }


    function add_to_sheet()
    {
        if(my_query.company_url.length>0)
        {
            document.getElementById("website").value=my_query.company_url;
        }
        if(my_query.company_phone.length>0)
        {
            document.getElementById("Phone_Number").value=my_query.company_phone;
        }
        if(my_query.company_email.length>0)
        {
            document.getElementById(" Email ").value=my_query.company_email;
        }
        if(my_query.company_owner.length>0)
        {
            document.getElementById(" Contact_Name").value=my_query.company_owner;
        }

        if(document.getElementById("website").value.length>0 &&
           document.getElementById("Phone_Number").value.length>0 &&
           document.getElementById(" Email ").value.length>0 &&
           document.getElementById(" Contact_Name").value.length>0) check_and_submit(check_function);


    }



    /* Create a promise to search for a site */
    function create_promise(search_str,i)
    {
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:"+my_query.sites[i].domain, resolve, reject, query_response,i);
        });
        if(my_query.sites[i].domain==="facebook.com")
        {
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise "+my_query.sites[i].domain +", "+ val); GM_setValue("returnHit",true); });
        }
        else
        {
            queryPromise.then(query_promise_then
                             )
                .catch(function(val) {
                console.log("Failed at this queryPromise "+my_query.sites[i].domain +", "+ val); GM_setValue("returnHit",true); });
        }
        return queryPromise;

    }

    function do_fbhome()
    {
        var result={email:"",name:"",url:"",phone:"",address:""};
        var about=document.getElementsByClassName("_u9q");
        var address,i;
        var url,inner_a;
        if(about.length===0) { GM_setValue("fb_result",result);
                               return; }
        about=about[0];
        address=about.getElementsByClassName("_2wzd");
        url=about.getElementsByClassName("_v0m");
        var possible_phone=about.getElementsByClassName("_4bl9");
        for(i=0; i < possible_phone.length; i++)
        {
            if(phone_re.test(possible_phone[i].innerText))
            {
                result.phone=possible_phone[i].innerText.trim();
            }
        }
        if(url.length>0)
        {
            url=url[0];
            result.url=url.innerText.replace(/^www\./,"http://www.").replace(/\n/g,"");
            /*inner_a=url.getElementsByTagName("a");
            for(i=0; i < inner_a.length; i++)
            {
                console.log("inner_a["+i+"].href="+inner_a[i].href);

                if(!/facebook\.com\//.test(inner_a[i].href))
                {
                    result.url=inner_a[i].href;
                    break;
                }
            }*/
          //  console.log("url.innerText="+url.innerText);
        }
        if(address.length>0)
        {
            result.address=address[0].innerText.replace(/\s*\n/g,",").replace(/\([^\)]+\)/,"");
        }
        GM_setValue("fb_result",result);

    }
    /* Do Facebook parsing  stuff */
    function do_fb()
    {
        console.log("Doing FB");
        var result={email:"",name:"",url:window.location.href,phone:""};
        var i;
        var contactlinks=document.getElementsByClassName("_50f4");
        var namelinks=document.getElementsByClassName("_42ef");
        if(window.location.href.indexOf("/about/")===-1)
        {
            do_fbhome();
            return;
        }

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

    function do_bingmaps()
    {
        var i;
        var result={address:""};
        var nameContainer=document.getElementsByClassName("nameContainer");
        console.log("do_bingmaps, tries="+my_query.map_tries);
        if(nameContainer.length===0)
        {
            my_query.map_tries++;
            if(my_query.map_tries<=10)
            {
                setTimeout(do_bingmaps,1000);
            }
            return;

        }
        result.address=nameContainer[0].innerText;
        GM_setValue("bingmaps_result",result);

    }
    /* Look into sending this there then calling the infrastructure */
    function finish_init()
    {
        var formcontrol=document.getElementsByClassName("form-control"),i;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        for(i=0; i < formcontrol.length; i++)
        {
            formcontrol[i].type="text";
        }

        var form=document.getElementById("mturk_form");
        var h2=form.getElementsByTagName("h2");
        my_query.company_name=wT.rows[0].cells[1].innerText;
        
        my_query.company_addressLine1=wT.rows[1].cells[1].innerText;
        my_query.company_city=wT.rows[2].cells[1].innerText;
        my_query.company_state=wT.rows[3].cells[1].innerText;
        my_query.company_zip=wT.rows[4].cells[1].innerText;
        my_query.company_url=wT.rows[5].cells[1].innerText;
        if(my_query.company_url.length>0)
        {
            if(!/www./.test(my_query.company_url) && !/^http/.test(my_query.company_url))
            {
                my_query.company_url="www."+my_query.company_url;
            }
            if(!/^http/.test(my_query.company_url))
            {
                my_query.company_url="https://"+my_query.company_url;
            }
        }


        console.log("my_query="+JSON.stringify(my_query));
    }

    function init_Query()
    {

        var i,name="";
    
    //   var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:name,
                 sites:[{domain:"facebook.com"},{domain:"bizapedia.com",parser:parse_bizapedia},
                        {domain:"yellowpages.com",parser:parse_yellowpages}],short_name:shorten_company_name(name),
                 company_address:"",company_name:"",company_owner:"",company_phone:"",company_email:"",company_url:"", done_site:[],
                 company_country:"",company_zip:"",company_stateOrRegion:"",company_city:"",company_addressLine1:"",fields:{website:""}};
        finish_init();
        for(i=0; i < my_query.sites.length; i++) my_query.done_site.push(false);
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.company_name+" "+my_query.company_city+" "+my_query.company_stateOrRegion,promise_list=[];
        for(i=0; i < my_query.sites.length; i++) promise_list.push(create_promise(search_str,i));
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
    else if(window.location.href.indexOf("facebook.com")!==-1)
    {
        GM_setValue("fb_url","https://www.facebook.com");
        console.log("Doing facebook");

        GM_addValueChangeListener("fb_url",function() {
            var url=GM_getValue("fb_url");
            console.log("url="+url);
            window.location.href=url;
        });
        setTimeout(do_fb,2500);
      /*  if(window.location.href.indexOf("?ref=hl")!==-1)
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
        }*/
    }
    else if(window.location.href.indexOf("bing.com/maps")!==-1)
    {
        my_query.map_tries=0;
        GM_setValue("bingmaps_url","https://www.bing.com/maps");
        GM_addValueChangeListener("bingmaps_url",function() { window.location.href=arguments[2]; });
        if(window.location.href.indexOf("bing.com/maps?q=")!==-1)
        {
            setTimeout(do_bingmaps,1500);
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
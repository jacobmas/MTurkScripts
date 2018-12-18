// ==UserScript==
// @name         BPearlman
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
// @require https://raw.githubusercontent.com/naptha/tesseract.js/master/dist/tesseract.js
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
		b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;



                if(!is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
		/* Do shit */
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
    function query_promise_then(result) {


    }


    function myloadImage(image, cb) {
        if (typeof image === 'string') {
            if (/^\#/.test(image)) {
                // element css selector
                return myloadImage(document.querySelector(image), cb);
            } else if (/(blob|data)\:/.test(image)) {
                // data url
                var im = new Image();
                im.src = image;
                im.onload = function (e) {
                    return myloadImage(im, cb);
                };
                return;
            } else {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', image, true);
                xhr.responseType = "blob";
                xhr.onload = function (e) {
                    return myloadImage(xhr.response, cb);
                };
                xhr.onerror = function (e) {
                    if (/^https?:\/\//.test(image) && !/^https:\/\/crossorigin.me/.test(image)) {
                        console.debug('Attempting to load image with CORS proxy');
                        myloadImage('https://crossorigin.me/' + image, cb);
                    }
                };
                xhr.send(null);
                return;
            }
        } else if (image instanceof File) {
            // files
            var fr = new FileReader();
            fr.onload = function (e) {
                return myloadImage(fr.result, cb);
            };
            fr.readAsDataURL(image);
            return;
        } else if (image instanceof Blob) {
            return myloadImage(URL.createObjectURL(image), cb);
        } else if (image.getContext) {
            // canvas element
            return myloadImage(image.getContext('2d'), cb);
        } else if (image.tagName == "IMG" || image.tagName == "VIDEO") {
            // image element or video element
            var c = document.createElement('canvas');
            c.width = image.naturalWidth || image.videoWidth;
            c.height = image.naturalHeight || image.videoHeight;
            var ctx = c.getContext('2d');
            ctx.drawImage(image, 0, 0);
            return myloadImage(ctx, cb);
        } else if (image.getImageData) {
            // canvas context
            var data = image.getImageData(0, 0, image.canvas.width, image.canvas.height);
            return myloadImage(data, cb);
        } else {
            return cb(image);
        }
    }


    function init_Query()
    {

        var clicks=[];
        var tableImage=document.getElementById("tableImage");
        console.log("tableImage.src="+tableImage.src);
        console.log("tableImage.width="+tableImage.width+"\ttableImage.height="+tableImage.height);
        console.log("tableImage.naturalWidth="+tableImage.naturalWidth+"\ttableImage.naturalHeight="+tableImage.naturalHeight);

        tableImage.addEventListener("click", function(e) {
            clicks.push({x: e.clientX*1.*tableImage.naturalWidth/tableImage.width, y: e.clientY*1.*tableImage.naturalHeight/tableImage.height});
           //  clicks.push({x: e.clientX*1, y: e.clientY*1.});

            console.log("clicks="+JSON.stringify(clicks));
            console.log("e.clientX="+e.clientX+", e.clientY="+e.clientY);
            if(clicks.length>=2)
            {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    tableImage.src,
                    responseType: "blob",
                    onload: function(response) {
                        tableImage.src=URL.createObjectURL(response.response);
                        tableImage.onload=function(e)
                        {
                            var c = document.createElement('canvas');
                            c.width = clicks[1].x-clicks[0].x;
                            c.height = clicks[1].y-clicks[0].y;
                            var ctx = c.getContext('2d');
                            ctx.drawImage(tableImage, clicks[0].x, clicks[0].y,clicks[1].x-clicks[0].x,clicks[1].y-clicks[0].y,0,0,
                                          c.width,c.height
                                         );
                            if(tableImage.nextElementSibling!==undefined && tableImage.nextElementSibling!==null)
                            {
                                console.log("tableImage.nextElementSibling="+tableImage.nextElementSibling);
                                tableImage.parentNode.removeChild(tableImage.nextElementSibling);
                                                                tableImage.parentNode.appendChild(c);

                            }
                            else
                            {
                                console.log("tableImage.nextSibling===null, "+tableImage.nextElementSibling===null);
                                tableImage.parentNode.appendChild(c);
                            }

                            Tesseract.recognize(ctx,

                                                {textord_tabfind_show_columns: 1,textord_tablefind_recognize_tables:'1',
                                                 textord_tabfind_find_tables: '1', textord_tabfind_show_blocks: '1', textord_tablefind_show_stats: '1',
                                                 textord_show_tables: '1',
                                                 tessedit_char_blacklist: '_—-',
                                                 classify_bln_numeric_mode: '1'})
                                .progress(function  (p) { console.log('progress', p)    })
                                .then(function (result) { console.log('result', result); clicks=[];
                                                        });
                        };
                    }
                });


            }


        });



          //  return myloadImage(ctx, cb);
console.log("BLOO");
       /* GM_xmlhttpRequest({
            method: 'GET',
            url:    tableImage.src,
            responseType: "blob",
            onload: function(response) {
             //   console.log("On load in crunch_response");
                 var blob_url=URL.createObjectURL(response.response);
            //    crunch_response(response, resolve, reject);
                                var im = new Image();
                im.src = blob_url;
                im.onload = function (e) {
                    console.log("im="+JSON.stringify(im));
                     //var data = im.getImageData(0, 0, im.canvas.width, im.canvas.height);
                    var imcont=im.getContext('2d');



                    Tesseract.recognize(imcont,

                                        {textord_tabfind_show_columns: 1,textord_tablefind_recognize_tables:'1',
                                        textord_tabfind_find_tables: '1', textord_tabfind_show_blocks: '1', textord_tablefind_show_stats: '1',
                                        textord_show_tables: '1',
                                        tessedit_char_blacklist: '_—-',
                                        classify_bln_numeric_mode: '1'})
       .progress(function  (p) { console.log('progress', p)    })
       .then(function (result) { console.log('result', result);

                                tableImage.parentNode.innerHTML=tableImage.parentNode.innerHTML+result.html;


                               });
                };
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });*/





//       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
//        my_query={name};

	



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
        GM_addValueChangeListener("nobacklink",function()
                                  {
            console.log("VAlue changed for nobacklink");
            if(GM_getValue("nobacklink")) init_Query(); });

        var submitButton=document.querySelector("input.btn[type='submit']");//getElementsById("submitButton");
        if(!submitButton.disabled && GM_getValue("nobacklink"))
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
        GM_setValue("nobacklink",false);
       var backlink=document.getElementsByClassName("back-to-search-link");
        if(backlink.length===0) GM_setValue("nobacklink",true);

        else GM_setValue("nobacklink",false);

        setTimeout(function() { if(backlink.length===0) GM_setValue("nobacklink",true); }, 500);
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
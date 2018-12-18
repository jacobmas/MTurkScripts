    function do_bloomberg()
    {
        console.log("Doing bloomberg");
        var result={"first-name":"","last-name":"",title:"","source-url":"", "success": false};
        var i;
        var pres_re=/(President)|(CEO)|(Chief Executive Officer)/;
        var bad_pres_re=/(Vice[\s\-]President)|(Market President)|(Regional President)/i;
        var officerInner=document.getElementsByClassName("officerInner");
        for(i=0; i < officerInner.length; i++)
        {
            var inner_divs=officerInner[i].getElementsByTagName("div");
            if(pres_re.test(inner_divs[1].innerText) && !bad_pres_re.test(inner_divs[1].innerText))
            {
                result["source-url"]=window.location.href;
                var fullname=parse_name_appell(inner_divs[0].innerText);
                result["first-name"]=fullname.fname;
                result["last-name"]=fullname.lname;
                result["title"]=inner_divs[1].innerText;
                result.success=true;
                GM_setValue("bloom_result",result);
                return;
            }

        }
        //GM_setValue("result",result);
    }

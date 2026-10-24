// هذا الكود يعمل تلقائياً بمجرد تحميل الصفحة دون الحاجة لأي مكتبة خارجية
window.onload = function() {
    
    // 1. التحكم بإظهار وإخفاء تفاصيل السيارة ديناميكياً
    var checkBoxes = document.getElementsByClassName('toggle-details');
    for (var i = 0; i < checkBoxes.length; i++) {
        checkBoxes[i].addEventListener('change', function() {
            // جلب سطر التفاصيل الذي يلي سطر السيارة الحالي مباشرة
            var carRow = this.closest('.car-row');
            var detailsRow = carRow.nextElementSibling;
            
            if (this.checked) {
                detailsRow.style.display = 'table-row';
            } else {
                detailsRow.style.display = 'none';
            }
        });
    }

    // 2. سلوك زر المتابعة لإظهار استمارة الحجز
    var btnContinue = document.getElementById('btn-continue');
    if (btnContinue) {
        btnContinue.addEventListener('click', function() {
            var selectedCars = document.querySelectorAll('.select-car:checked');
            var bookingSection = document.getElementById('bookingFormSection');
            
            if (selectedCars.length === 0) {
                alert('خطأ: يرجى تحديد سيارة واحدة على الأقل من الجدول للمتابعة.');
                bookingSection.style.display = 'none';
            } else {
                bookingSection.style.display = 'block';
            }
        });
    }

    // 3. معالجة الاستمارة والتحقق من المدخلات وحساب المجاميع
    var rentForm = document.getElementById('rentForm');
    if (rentForm) {
        rentForm.addEventListener('submit', function(e) {
            e.preventDefault(); // منع تحديث الصفحة

            // قراءة قيم المدخلات وتخزينها بكائن متناسق 
            var clientData = {
                fullName: document.getElementById('fullName').value.trim(),
                nationalId: document.getElementById('nationalId').value.trim(),
                startDateStr: document.getElementById('startDate').value.trim(),
                endDateStr: document.getElementById('endDate').value.trim(),
                mobileNumber: document.getElementById('mobileNumber').value.trim(),
                emailAddress: document.getElementById('emailAddress').value.trim()
            };

            // التعبيرات المنتظمة (Regex) للتحقق الصارم
            var arabicRegex = /^[\u0600-\u06FF\s]*$/; 
            var dateRegex = /^\d{4}-\d{2}-\d{2}$/; 
            var syrianMobileRegex = /^09\d{8}$/; 
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (clientData.fullName !== "" && !arabicRegex.test(clientData.fullName)) {
                alert("خطأ تقني: يجب استخدام الحروف الهجائية العربية فقط في حقل الاسم.");
                return false;
            }

            if (clientData.nationalId === "") {
                alert("خطأ: حقل الرقم الوطني إلزامي.");
                return false;
            }
            if (clientData.nationalId.length !== 11 || isNaN(clientData.nationalId)) {
                alert("خطأ: الرقم الوطني السوري يجب أن يتألف من 11 خانة رقمية.");
                return false;
            }
            
            var provinceCode = parseInt(clientData.nationalId.substring(0, 2), 10);
            if (provinceCode < 1 || provinceCode > 14) {
                alert("خطأ: أول خانتين في الرقم الوطني يجب أن تكون رمزاً صحيحاً للمحافظات (من 01 إلى 14).");
                return false;
            }

            if (clientData.startDateStr === "" || clientData.endDateStr === "") {
                alert("خطأ: تواريخ الإيجار حقول إلزامية لا يمكن تركها فارغة.");
                return false;
            }
            if (!dateRegex.test(clientData.startDateStr) || !dateRegex.test(clientData.endDateStr)) {
                alert("خطأ: صيغة التاريخ المعتمدة هي yyyy-mm-dd فقط.");
                return false;
            }

            var sDate = new Date(clientData.startDateStr);
            var eDate = new Date(clientData.endDateStr);

            if (eDate <= sDate) {
                alert("خطأ: تاريخ نهاية التأجير يجب أن يكون لاحقاً ومستقبلياً بالنسبة لتاريخ البداية.");
                return false;
            }

            if (clientData.mobileNumber !== "" && !syrianMobileRegex.test(clientData.mobileNumber)) {
                alert("خطأ: رقم الموبايل غير مطابق لشبكات سيريتل أو MTN (يجب أن يبدأ بـ 09 ويتكون من 10 أرقام).");
                return false;
            }

            if (clientData.emailAddress !== "" && !emailRegex.test(clientData.emailAddress)) {
                alert("خطأ: صيغة البريد الإلكتروني غير صالحة.");
                return false;
            }

            // حساب عدد الأيام الفعلي
            var timeDifference = eDate.getTime() - sDate.getTime();
            var totalDays = Math.ceil(timeDifference / (1000 * 3600 * 24));

            // معالجة البيانات عبر مصفوفة (Array)
            var selectedCarsList = [];
            var rawTotalAmount = 0;
            var selectedCarsCheckboxes = document.querySelectorAll('.select-car:checked');

            selectedCarsCheckboxes.forEach(function(checkbox) {
                var row = checkbox.closest('.car-row');
                var modelText = row.querySelector('.model').textContent || row.querySelector('.model').innerText;
                var priceElement = row.querySelector('.price');
                var priceValue = parseFloat(priceElement.getAttribute('data-price'));
                
                var carInfo = {
                    model: modelText.trim(),
                    price: priceValue
                };
                selectedCarsList.push(carInfo);
                rawTotalAmount += (carInfo.price * totalDays);
            });

            // احتساب الخصم 10% إذا تجاوزت المدة 7 أيام
            var discountAmount = 0;
            var finalPayable = rawTotalAmount;
            if (totalDays > 7) {
                discountAmount = rawTotalAmount * 0.10;
                finalPayable = rawTotalAmount - discountAmount;
            }

            // بناء كود الـ HTML ديناميكياً لتعديل محتوى الصفحة
            var invoiceHtml = "<p><strong>اسم العميل:</strong> " + (clientData.fullName ? clientData.fullName : "لم يذكر") + "</p>";
            invoiceHtml += "<p><strong>الرقم الوطني:</strong> " + clientData.nationalId + "</p>";
            invoiceHtml += "<p><strong>مدة الحجز الفعالة:</strong> " + totalDays + " يوم/أيام</p>";
            invoiceHtml += "<h4>السيارات المحجوزة:</h4><ul>";
            
            for (var i = 0; i < selectedCarsList.length; i++) {
                invoiceHtml += "<li>" + selectedCarsList[i].model + " - السعر اليومي: " + selectedCarsList[i].price + " ل.س</li>";
            }
            invoiceHtml += "</ul>";
            invoiceHtml += "<p>المجموع الأولي: " + rawTotalAmount + " ل.س</p>";
            invoiceHtml += "<p>قيمة الخصم الممنوح (10%): " + discountAmount + " ل.س</p>";
            invoiceHtml += "<h3><strong>المبلغ النهائي الإجمالي الواجب دفعه: " + finalPayable + " ل.س</strong></h3>";

            //  وتعديل محتوى الصفحة وإظهار الفاتورة ديناميكياً
            document.getElementById('invoiceContent').innerHTML = invoiceHtml;
            document.getElementById('resultInvoiceSection').style.display = 'block';
            
            alert("تمت معالجة الطلب وحساب الفاتورة بنجاح في أسفل الصفحة!");
        });
    }
};

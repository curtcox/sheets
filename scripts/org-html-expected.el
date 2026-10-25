;;; org-html-expected.el --- Native HTML table oracle -*- lexical-binding: t; -*-
(require 'org)
(require 'org-table)
(require 'ox-html)
(require 'dom)
(require 'json)
(require 'seq)
(unless (and (fboundp 'libxml-parse-html-region) (libxml-available-p))
  (error "Org HTML reference checks need an Emacs build with libxml2"))

;; Record actual exported DOM structure, not an imitation of export predicates.
;; Each cell is tag:scope:alignment. Random IDs, theme, and rich cell contents
;; are outside this bounded header/alignment comparison.
(dolist (file (directory-files "tests/fixtures/org-html" t "\\.org$"))
  (let* ((org-export-use-babel nil)
         (source (with-temp-buffer
                   (insert-file-contents file)
                   (org-mode)
                   (org-table-recalculate-buffer-tables)
                   (buffer-string)))
         (html (org-export-string-as source 'html t '(:with-toc nil)))
         (dom (with-temp-buffer
                (insert html)
                (libxml-parse-html-region (point-min) (point-max))))
         (tables
          (mapcar
           (lambda (table)
             (vconcat
              (mapcar
               (lambda (group)
                 `((tag . ,(symbol-name (dom-tag group)))
                   (rows . ,(vconcat
                             (mapcar
                              (lambda (row)
                                (vconcat
                                 (mapcar
                                  (lambda (cell)
                                    (format "%s:%s:%s"
                                            (dom-tag cell)
                                            (or (dom-attr cell 'scope) "")
                                            (replace-regexp-in-string
                                             "org-" "" (or (dom-attr cell 'class) ""))))
                                  (seq-filter (lambda (n) (and (listp n) (memq (dom-tag n) '(th td))))
                                              (dom-children row)))))
                              (dom-by-tag group 'tr))))))
               (seq-filter (lambda (n) (and (listp n) (memq (dom-tag n) '(thead tbody))))
                           (dom-children table)))))
           (dom-by-tag dom 'table))))
    (with-temp-file
        (expand-file-name (concat (file-name-nondirectory file) ".html.expected")
                          (getenv "SHEETS_ORG_OUTPUT"))
      (insert (json-encode (vconcat tables))))))

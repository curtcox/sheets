;;; org-expected.el --- Org fixture oracle -*- lexical-binding: t; -*-
(require 'org)
(require 'org-table)
(let ((files (directory-files "tests/fixtures/org" t "\\.org$")))
  (dolist (file files)
    ;; Lisp is explicitly unsupported; its diagnostic is checked by unit tests.
    (unless (string-match-p "/error\\.org$" file)
      (with-temp-buffer
        (insert-file-contents file)
        (org-mode)
        (org-table-recalculate-buffer-tables)
        (write-region (point-min) (point-max)
                      (expand-file-name
                       (concat (file-name-nondirectory file) ".expected")
                       (getenv "SHEETS_ORG_OUTPUT")) nil 'silent)))))

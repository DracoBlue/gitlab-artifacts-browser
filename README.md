# gitlab artifacts browser

If you are running gitlab on helm charts, the pages addon is not available (see <https://gitlab.com/gitlab-org/charts/gitlab/issues/37> for more information).

But if you rely on having the artifacts like index.html of your code coverage accessible by link, this gitlab articacts browser might be a viable workaround.

## setup

Setup your environment variables, given that:

1. your gitlab runs at <git.example.org>
2. your gitlab artifacts browser runs at <gitlab-artifacts-browser.example.org>
3. your gitlab oauth application created at <https://git.example.org/admin/applications> has the given app id (`asdfh`) and secret (`egfhc`).

```
GITLAB_URL=https://git.example.org/
GITLAB_OAUTH_APPLICATION_ID=asdfh
GITLAB_OAUTH_APPLICATION_SECRET=egfhc
GITLAB_OAUTH_REDIRECT_URI="http://gitlab-artiacts-browser.example.org/auth/gitlab/callback"
```

## usage

### specific file of a job

If your gitlab url to a file is <https://git.example.org/namespace/projectname/-/jobs/5/artifacts/file/folder/subfolder/file.html> copy the part after the gitlab base url
and suffix your gitlab artifacts browser url with that: <https://gitlab-artiacts-browser.example.org/namespace/projectname/-/jobs/5/artifacts/file/folder/subfolder/file.html>

### latest file of a job of a branch

Generate an url relative to your gitlab-artifacts-browser like this:

<http://gitlab-artiacts-browser.example.org/branch-artifacts/namespace/project/branch/job/folder/subfolder/file.html>

if your files are like this:

1. your gitlab group is called **namespace**
2. your gitlab project is called **project**
3. your branch is called **branch**
4. the executed job is called **job**
5. the job has an artifact in the folder called **folder/subfolder**
6. the artifact is called **file.html**


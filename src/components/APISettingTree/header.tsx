// API栏目的顶部功能栏
import { defineComponent, inject, onBeforeUnmount, PropType } from "vue";
import { css } from "@linaria/core";
import {
  NDropdown,
  NButton,
  NGi,
  NGrid,
  NInput,
  NIcon,
  useMessage,
  useDialog,
} from "naive-ui";
import { DropdownMixedOption } from "naive-ui/es/dropdown/src/interface";

import { i18nCollection, i18nCommon } from "../../i18n";
import { SettingType, useAPISettingStore } from "../../stores/api_setting";
import {
  AnalyticsOutline,
  CloudUploadOutline,
  DownloadOutline,
  FolderOpenOutline,
  FolderOutline,
} from "@vicons/ionicons5";
import {
  hotKeyCreateFolder,
  hotKeyCreateHTTPSetting,
  hotKeyMatchCreateHTTPSetting,
} from "../../helpers/hot_key";
import {
  addFolderDefaultValue,
  addFolderKey,
  addHTTPSettingDefaultValue,
  addHTTPSettingKey,
} from "../../constants/provide";
import { readTextFromClipboard, showError } from "../../helpers/util";
import { useRoute } from "vue-router";
import { useAPIFolderStore } from "../../stores/api_folder";
import { importAPI, ImportCategory } from "../../commands/import_api";
import { useAPICollectionStore } from "../../stores/api_collection";
import { HandleKey } from "../../constants/handle_key";
import { newImportDialog } from "../ExDialog";

const collapseWidth = 50;

const headerClass = css`
  margin-right: ${collapseWidth}px;
  position: relative;
  .collapse {
    position: absolute;
    top: 0;
    right: ${-collapseWidth}px;
    bottom: 0;
    width: ${collapseWidth}px;
    .n-button {
      margin-left: 10px;
    }
  }
`;

const addDropdownClass = css`
  .label {
    min-width: 180px;
  }
  .hotKey {
    float: right;
  }
`;

const importPostmanKey = "importPostman";
const importInsomniaKey = "importInsomnia";

export default defineComponent({
  name: "APISettingTreeHeader",
  props: {
    onFilter: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
  },
  setup() {
    const route = useRoute();
    const message = useMessage();
    const dialog = useDialog();
    const folderStore = useAPIFolderStore();
    const apiSettingStore = useAPISettingStore();
    const collectionStore = useAPICollectionStore();

    const collection = route.query.id as string;
    const addHTTPSetting = inject(
      addHTTPSettingKey,
      addHTTPSettingDefaultValue
    );
    const addFolder = inject(addFolderKey, addFolderDefaultValue);

    const handleKeydown = (e: KeyboardEvent) => {
      if (hotKeyMatchCreateHTTPSetting(e)) {
        addHTTPSetting("");
        return;
      }
    };
    document.addEventListener("keydown", handleKeydown);
    onBeforeUnmount(() => {
      document.removeEventListener("keydown", handleKeydown);
    });

    const handleImport = async (category: ImportCategory) => {
      try {
        const done = await importAPI({
          category,
          collection,
          message,
        });
        if (done) {
          // 重新加载数据，触发页面刷新
          await folderStore.fetch(collection);
          await apiSettingStore.fetch(collection);
          message.info(i18nCollection("importSuccess"));
        }
      } catch (err) {
        showError(message, err);
      }
    };

    const handleCloseAllFolders = async () => {
      try {
        await collectionStore.closeAllFolders(collection);
      } catch (err) {
        showError(message, err);
      }
    };

    const hanldeImport = async () => {
      try {
        const data = (await readTextFromClipboard()) || "";
        newImportDialog({
          dialog,
          collection,
          data,
        });
      } catch (err) {
        showError(message, err);
      }
    };

    return {
      hanldeImport,
      addHTTPSetting,
      addFolder,
      handleImport,
      handleCloseAllFolders,
      text: {
        add: i18nCommon("add"),
        placeholder: i18nCollection("filterPlaceholder"),
      },
    };
  },
  render() {
    const options: DropdownMixedOption[] = [
      {
        label: `${i18nCollection(
          "newHTTPRequest"
        )} | ${hotKeyCreateHTTPSetting()}`,
        key: SettingType.HTTP,
        icon: () => (
          <NIcon>
            <AnalyticsOutline />
          </NIcon>
        ),
      },
      {
        label: `${i18nCollection("newFolder")} | ${hotKeyCreateFolder()}`,
        key: SettingType.Folder,
        icon: () => (
          <NIcon>
            <FolderOpenOutline />
          </NIcon>
        ),
      },
      {
        type: "divider",
        key: "divider",
      },
      {
        label: i18nCollection("importSettings"),
        key: HandleKey.ImportSettings,
        icon: () => (
          <NIcon>
            <DownloadOutline class="rotate270" />
          </NIcon>
        ),
      },
      {
        label: i18nCollection("importPostman"),
        key: importPostmanKey,
        icon: () => (
          <NIcon>
            <CloudUploadOutline />
          </NIcon>
        ),
      },
      {
        label: i18nCollection("importInsomnia"),
        key: importInsomniaKey,
        icon: () => (
          <NIcon>
            <CloudUploadOutline />
          </NIcon>
        ),
      },
    ];
    const { text } = this;
    return (
      <div class={headerClass}>
        <NGrid xGap={8}>
          <NGi span={16}>
            <NInput
              type="text"
              clearable
              placeholder={text.placeholder}
              onInput={(value: string) => {
                this.$props.onFilter(value.toLowerCase());
              }}
            />
          </NGi>
          <NGi span={8}>
            <NDropdown
              class={addDropdownClass}
              trigger="click"
              options={options}
              renderLabel={(option) => {
                const arr = (option.label as string).split(" | ");
                const hotkey =
                  arr.length === 2 ? (
                    <span class="hotKey">{arr[1]}</span>
                  ) : undefined;

                return (
                  <div class="label">
                    {arr[0]}
                    {hotkey}
                  </div>
                );
              }}
              onSelect={(key: string) => {
                switch (key) {
                  case SettingType.HTTP:
                    this.addHTTPSetting("");
                    break;
                  case SettingType.Folder:
                    this.addFolder("");
                    break;
                  case HandleKey.ImportSettings:
                    this.hanldeImport();
                    break;
                  case importPostmanKey:
                    this.handleImport(ImportCategory.PostMan);
                    break;
                  case importInsomniaKey:
                    this.handleImport(ImportCategory.Insomnia);
                    break;
                }
              }}
            >
              <NButton class="widthFull">{text.add}</NButton>
            </NDropdown>
          </NGi>
        </NGrid>
        <div class="collapse">
          <NButton
            onClick={() => {
              this.handleCloseAllFolders();
            }}
          >
            <NIcon>
              <FolderOutline />
            </NIcon>
          </NButton>
        </div>
      </div>
    );
  },
});

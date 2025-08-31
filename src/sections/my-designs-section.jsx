import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Card,
  Menu,
  MenuItem,
  Position,
  Spinner,
  Popover,
} from '@blueprintjs/core';
import { DocumentOpen, Trash, More, Upload } from '@blueprintjs/icons';

import { CloudWarning } from '../cloud-warning';

import { SectionTab } from 'polotno/side-panel';
import FaFolder from '@meronex/icons/fa/FaFolder';
import { useProject } from '../project';
import * as api from '../api';
import { getImageSize } from 'polotno/utils/image';
import { pxToUnitRounded, unitToPx } from 'polotno/utils/unit';

// import { listAssets, uploadAsset, deleteAsset } from '../api';
import { dataURLtoBlob } from '../blob';

const MIN_PX = 10;

const DesignCard = observer(({ design, store, onDelete }) => {
  const [loading, setLoading] = React.useState(false);
  const [previewURL, setPreviewURL] = React.useState(design.previewURL);

  React.useEffect(() => {
    const load = async () => {
      try {
        const url = await api.getPreview({ id: design.id });
        setPreviewURL(url);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleSelect = async () => {
    setLoading(true);
    window.project.loadById(design.id);
    setLoading(false);
  };

  return (
    <Card
      style={{ margin: '3px', padding: '0px', position: 'relative' }}
      interactive
      onClick={() => {
        handleSelect();
      }}
    >
      <img src={previewURL} style={{ width: '100%', minHeight: '100px' }} />
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '3px',
        }}
      >
        {design.name || 'Untitled'}
      </div>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Spinner />
        </div>
      )}
      <div
        style={{ position: 'absolute', top: '5px', right: '5px' }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Popover
          content={
            <Menu>
              <MenuItem
                icon={<DocumentOpen />}
                text="Open"
                onClick={() => {
                  handleSelect();
                }}
              />
              <MenuItem
                icon={<Trash />}
                text="Delete"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete it?')) {
                    onDelete({ id: design.id });
                  }
                }}
              />
            </Menu>
          }
          position={Position.BOTTOM}
        >
          <Button icon={<More />} />
        </Popover>
      </div>
    </Card>
  );
});

export const MyDesignsPanel = observer(({ store }) => {
  const project = useProject();
  const [designsLoadings, setDesignsLoading] = React.useState(false);
  const [designs, setDesigns] = React.useState([]);

  const loadDesigns = async () => {
    setDesignsLoading(true);
    const list = await api.listDesigns();
    setDesigns(list);
    setDesignsLoading(false);
  };

  const handleProjectDelete = ({ id }) => {
    setDesigns(designs.filter((design) => design.id !== id));
    api.deleteDesign({ id });
  };

  React.useEffect(() => {
    loadDesigns();
  }, [project.cloudEnabled, project.designsLength]);

  const half1 = [];
  const half2 = [];

  designs.forEach((design, index) => {
    if (index % 2 === 0) {
      half1.push(design);
    } else {
      half2.push(design);
    }
  });

  const applyResize = (unitW = w, unitH = h) => {
    const widthPx = unitToPx({
      unitVal: unitW,
      unit: store.unit,
      dpi: store.dpi,
    });
    const heightPx = unitToPx({
      unitVal: unitH,
      unit: store.unit,
      dpi: store.dpi,
    });
    if (widthPx >= MIN_PX && heightPx >= MIN_PX){
      store.setSize(widthPx, heightPx, true);
    }
  };

  function getType(file) {
    const { type } = file;
    if (type.indexOf('svg') >= 0) {
      return 'svg';
    }
    if (type.indexOf('image') >= 0) {
      return 'image';
    }
    if (type.indexOf('video') >= 0) {
      return 'video';
    }
    return 'image';
  }

  const getImageFilePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result;
        // now we need to render that image into smaller canvas and get data url
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 200;
          canvas.height = (200 * img.height) / img.width;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  };

  const getImageFileBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result;
        // now we need to render that image into smaller canvas and get data url
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreateFromImage = async (e) => {
    // #1 上传图片
    const file = e.target.files[0];
    if (!file) return;

    const type = getType(file);
    let previewDataURL = '';
    previewDataURL = await getImageFilePreview(file);
    const preview = dataURLtoBlob(previewDataURL);
    // await api.uploadAsset({ file, preview, type });
    
    const url = URL.createObjectURL(file);
    const fileBlob = dataURLtoBlob(previewDataURL);
    let fileBase64 = "";
    getImageFileBase64(file).then((result)=>{
      console.log(result);
      fileBase64 = result;
    })
    
    // console.log(fileBase64);
    
    
    // #2 创建新工程
    await project.createNewDesign(file.name);
    loadDesigns();

    // #3 新工程缩放到图片大小
    // 获取图片尺寸
    const { width, height } = await getImageSize(url);
    // 缩放
    store.setUnit({ unit:'px', dpi: store.dpi });
    applyResize(width, height);

    // #4 导入图片
    store.activePage.addElement({
      type: 'image',
      src: fileBase64,
      width,
      height,
      x: 0,
      y: 0,
    });

    // #5 保存
    window.project.requestSave();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Button
        fill
        intent="primary"
        onClick={async () => {
          await project.createNewDesign();
          loadDesigns();
        }}
      >
        Create new design
      </Button>

      {/* 从图片创建工程按钮 */}
      <label htmlFor="create-from-image-input">
        <Button
          fill
          icon={<Upload />}
          intent="success"
          style={{ marginTop: '10px' }}
          onClick={() =>
            document.getElementById('create-from-image-input')?.click()
          }
        >
          从图片创建工程
        </Button>
        <input
          type="file"
          id="create-from-image-input"
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleCreateFromImage}
        />
      </label>

      {!designsLoadings && !designs.length && (
        <div style={{ paddingTop: '20px', textAlign: 'center', opacity: 0.6 }}>
          You have no saved designs yet...
        </div>
      )}
      {!project.cloudEnabled && (
        <div style={{ padding: '15px' }}>
          <CloudWarning />
        </div>
      )}
      {project.cloudEnabled && (
        <div style={{ padding: '10px', textAlign: 'center' }}>
          Cloud data saving powered by{' '}
          <a href="https://puter.com" target="_blank">
            Puter.com
          </a>
        </div>
      )}
      {designsLoadings && (
        <div style={{ padding: '30px' }}>
          <Spinner />
        </div>
      )}
      <div
        style={{
          display: 'flex',
          paddingTop: '5px',
          height: '100%',
          overflow: 'auto',
        }}
      >
        <div style={{ width: '50%' }}>
          {half1.map((design) => (
            <DesignCard
              design={design}
              key={design.id}
              store={store}
              onDelete={handleProjectDelete}
            />
          ))}
        </div>
        <div style={{ width: '50%' }}>
          {half2.map((design) => (
            <DesignCard
              design={design}
              key={design.id}
              store={store}
              onDelete={handleProjectDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// define the new custom section
export const MyDesignsSection = {
  name: 'my-designs',
  Tab: (props) => (
    <SectionTab name="My Designs" {...props}>
      <FaFolder />
    </SectionTab>
  ),
  // we need observer to update component automatically on any store changes
  Panel: MyDesignsPanel,
};
